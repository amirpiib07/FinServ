package com.finserv.common.security;

import com.finserv.common.util.UuidUtils;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.organization.repository.BranchRepository;
import com.finserv.modules.identity.entity.Role;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.entity.UserRole;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.identity.repository.UserRoleRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Ensures instant-access demo personas are reliably provisioned and have in-sync credentials:
 * 1. Customer: alex.kumar / AlexSecureP@ss1! (Active verified customer with funded savings account)
 * 2. Bank Officer: officer.mumbai / OfficerSecureP@ss1! (ROLE_EMPLOYEE, ROLE_ADMIN)
 * 3. Super Admin: amit.kumar.singh / AdminMasterP@ss1! (ROLE_SUPER_ADMIN, ROLE_ADMIN)
 */
@Component
@Order(20)
public class DemoPersonaBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoPersonaBootstrapRunner.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerLookupService customerLookupService;
    private final AccountRepository accountRepository;
    private final BranchRepository branchRepository;
    private final AccountProductRepository accountProductRepository;

    public DemoPersonaBootstrapRunner(UserRepository userRepository,
                                      RoleRepository roleRepository,
                                      UserRoleRepository userRoleRepository,
                                      PasswordEncoder passwordEncoder,
                                      CustomerLookupService customerLookupService,
                                      AccountRepository accountRepository,
                                      BranchRepository branchRepository,
                                      AccountProductRepository accountProductRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.customerLookupService = customerLookupService;
        this.accountRepository = accountRepository;
        this.branchRepository = branchRepository;
        this.accountProductRepository = accountProductRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        try {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElse(null);
            Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN").orElse(adminRole);
            Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE").orElse(null);
            Role customerRole = roleRepository.findByName("ROLE_CUSTOMER").orElse(null);

            if (adminRole == null || customerRole == null) {
                log.warn("DemoPersonaBootstrap: Essential roles not yet present in database. Skipping demo provisioning.");
                return;
            }

            // 1. Super Admin Demo Account
            ensureDemoUser("amit.kumar.singh", "amit.kumar.singh@finserv.local", "+919999999901",
                    "AdminMasterP@ss1!", List.of(adminRole, superAdminRole != null ? superAdminRole : adminRole));

            // 2. Bank Officer Demo Account
            if (employeeRole != null) {
                ensureDemoUser("officer.mumbai", "officer.mumbai@finserv.local", "+919999999902",
                        "OfficerSecureP@ss1!", List.of(employeeRole, adminRole));
            }

            // 3. Retail Customer Demo Account
            User customerUser = ensureDemoUser("alex.kumar", "alex.kumar@finserv.local", "+919999999903",
                    "AlexSecureP@ss1!", List.of(customerRole));

            if (customerUser != null) {
                provisionCustomerAccounts(customerUser);
            }

            log.info("DemoPersonaBootstrap: All 3 demo access personas verified and active.");
        } catch (Exception e) {
            log.error("DemoPersonaBootstrap: Failed to bootstrap demo personas cleanly: {}", e.getMessage(), e);
        }
    }

    private User ensureDemoUser(String username, String email, String phone, String password, List<Role> roles) {
        Optional<User> existingOpt = userRepository.findByUsername(username);
        User user;
        if (existingOpt.isPresent()) {
            user = existingOpt.get();
            // Sync password and ensure ACTIVE
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setStatus("ACTIVE");
            user.setEmailVerifiedAt(Instant.now());
            user.setPhoneVerifiedAt(Instant.now());
            user = userRepository.save(user);
        } else {
            // Check if email or phone is taken by a legacy test user
            Optional<User> emailUserOpt = userRepository.findByEmail(email);
            if (emailUserOpt.isPresent()) {
                user = emailUserOpt.get();
                user.setUsername(username);
                user.setPasswordHash(passwordEncoder.encode(password));
                user.setStatus("ACTIVE");
                user = userRepository.save(user);
            } else {
                UUID userId = UuidUtils.generateV4();
                user = new User(userId);
                user.setUsername(username);
                user.setEmail(email);
                user.setPhoneNumber(phone);
                user.setPasswordHash(passwordEncoder.encode(password));
                user.setStatus("ACTIVE");
                user.setSystem(false);
                user.setFailedLoginAttempts(0);
                user.setEmailVerifiedAt(Instant.now());
                user.setPhoneVerifiedAt(Instant.now());
                user = userRepository.save(user);
            }
        }

        // Assign roles
        UUID userId = user.getId();
        var existingUserRoles = userRoleRepository.findByUserId(userId);
        for (Role role : roles) {
            if (role != null) {
                boolean hasRole = existingUserRoles.stream().anyMatch(ur -> ur.getRoleId().equals(role.getId()));
                if (!hasRole) {
                    userRoleRepository.save(new UserRole(userId, role.getId()));
                }
            }
        }

        return user;
    }

    private void provisionCustomerAccounts(User user) {
        try {
            Customer customer = customerLookupService.getOrCreateCustomerForUser(user.getId());
            customer.setFirstName("Alex");
            customer.setLastName("Kumar");
            customer.setKycStatus("VERIFIED");
            customer.setKycTier("TIER_1");

            List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
            if (accounts.isEmpty()) {
                List<Branch> branches = branchRepository.findAll();
                List<AccountProduct> products = accountProductRepository.findAll();

                if (!branches.isEmpty() && !products.isEmpty()) {
                    Branch branch = branches.get(0);
                    AccountProduct product = products.get(0);

                    Account account = new Account();
                    account.setCustomerId(customer.getId());
                    account.setBranchId(branch.getId());
                    account.setProductId(product.getId());
                    account.setAccountNumber("1002" + String.format("%010d", Math.abs(user.getId().hashCode()) % 10000000000L));
                    account.setCurrency("INR");
                    account.setStatus("ACTIVE");
                    account.setCurrentBalance(new BigDecimal("25000.00"));
                    account.setAvailableBalance(new BigDecimal("25000.00"));
                    account.setHoldBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
                    account.setOpenedAt(Instant.now());
                    account.setNickname("Primary Savings Account");

                    accountRepository.save(account);
                    log.info("DemoPersonaBootstrap: Created initial funded savings account {} for customer {}",
                            account.getAccountNumber(), customer.getCustomerNumber());
                }
            }
        } catch (Exception e) {
            log.warn("DemoPersonaBootstrap: Could not provision customer account for {}: {}", user.getUsername(), e.getMessage());
        }
    }
}
