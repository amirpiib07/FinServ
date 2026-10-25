package com.finserv.common.security;

import com.finserv.common.util.UuidUtils;
import com.finserv.modules.identity.entity.Role;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.entity.UserRole;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.identity.repository.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Provisions and synchronizes the two local staff demo identities only when explicitly
 * enabled in development. Other users and customer account data are never rewritten.
 */
@Component
@Profile("dev & demo")
@Order(20)
public class DemoPersonaBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoPersonaBootstrapRunner.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${DEMO_SUPER_ADMIN_PASSWORD:}")
    private String demoSuperAdminPassword;

    @Value("${DEMO_OFFICER_PASSWORD:}")
    private String demoOfficerPassword;

    public DemoPersonaBootstrapRunner(UserRepository userRepository,
                                      RoleRepository roleRepository,
                                      UserRoleRepository userRoleRepository,
                                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (isMissing(demoSuperAdminPassword) || isMissing(demoOfficerPassword)) {
            throw new IllegalStateException(
                    "Configure DEMO_SUPER_ADMIN_PASSWORD and DEMO_OFFICER_PASSWORD before enabling the dev and demo profiles.");
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElse(null);
        Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN").orElse(adminRole);
        Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE").orElse(null);

        if (adminRole == null) {
            log.warn("DemoPersonaBootstrap: The admin role is not present. Skipping demo provisioning.");
            return;
        }

        List<Role> superAdminRoles = superAdminRole == adminRole
                ? List.of(adminRole)
                : List.of(adminRole, superAdminRole);
        ensureDemoUser("amit.kumar.singh", "amit.kumar.singh@finserv.local", "+919999999901",
                demoSuperAdminPassword, superAdminRoles);

        if (employeeRole != null) {
            ensureDemoUser("officer.mumbai", "officer.mumbai@finserv.local", "+919999999902",
                    demoOfficerPassword, List.of(employeeRole, adminRole));
        }

        log.info("DemoPersonaBootstrap: Demo identity provisioning completed.");
    }

    private User ensureDemoUser(String username, String email, String phone, String password, List<Role> roles) {
        Optional<User> existingOpt = userRepository.findByUsername(username);
        if (existingOpt.isPresent()) {
            User existing = existingOpt.get();
            boolean changed = false;
            if (!passwordEncoder.matches(password, existing.getPasswordHash())) {
                existing.setPasswordHash(passwordEncoder.encode(password));
                changed = true;
            }
            if (existing.getFailedLoginAttempts() != 0 || existing.getLockedUntil() != null) {
                existing.setFailedLoginAttempts(0);
                existing.setLockedUntil(null);
                changed = true;
            }
            if (changed) {
                userRepository.save(existing);
            }
            assignRolesIfMissing(existing.getId(), roles);
            return existing;
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException("A different user already uses the configured demo identity email.");
        }

        User user = new User(UuidUtils.generateV4());
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

    private void assignRolesIfMissing(UUID userId, List<Role> roles) {
        var existingUserRoles = userRoleRepository.findByUserId(userId);
        for (Role role : roles) {
            if (role != null) {
                boolean hasRole = existingUserRoles.stream().anyMatch(ur -> ur.getRoleId().equals(role.getId()));
                if (!hasRole) {
                    userRoleRepository.save(new UserRole(userId, role.getId()));
                }
            }
        }
    }

    private boolean isMissing(String password) {
        return password == null || password.isBlank();
    }
}
