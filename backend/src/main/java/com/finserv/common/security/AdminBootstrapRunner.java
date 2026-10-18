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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Idempotent superadmin bootstrapping runner.
 * Reads ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD from environment variables only.
 * Skips gracefully if credentials are not configured (zero hardcoded defaults).
 */
@Component
@Order(10)
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrapRunner(UserRepository userRepository,
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
        if (adminUsername == null || adminUsername.isBlank() ||
                adminPassword == null || adminPassword.isBlank()) {
            log.warn("Superadmin bootstrap: ADMIN_USERNAME or ADMIN_PASSWORD not configured. Skipping admin initialization.");
            return;
        }

        Optional<Role> adminRoleOpt = roleRepository.findByName("ROLE_ADMIN");
        Optional<Role> superAdminRoleOpt = roleRepository.findByName("ROLE_SUPER_ADMIN");
        if (adminRoleOpt.isEmpty()) {
            log.warn("Superadmin bootstrap: ROLE_ADMIN not found in roles table. Ensure migrations have run. Skipping.");
            return;
        }
        Role adminRole = adminRoleOpt.get();
        Role superAdminRole = superAdminRoleOpt.orElse(adminRole);

        ensureAdminUser(adminUsername, adminEmail != null && !adminEmail.isBlank() ? adminEmail : "admin@finserv.local",
                "+910000000099", adminPassword, adminRole, superAdminRole);

        // Also ensure amit.kumar.singh is provisioned if distinct
        if (!"amit.kumar.singh".equalsIgnoreCase(adminUsername)) {
            ensureAdminUser("amit.kumar.singh", "amit.kumar.singh@finserv.local",
                    "+910000000098", adminPassword, adminRole, superAdminRole);
        }
    }

    private void ensureAdminUser(String username, String email, String phone, String password,
                                 Role adminRole, Role superAdminRole) {
        Optional<User> existingUserOpt = userRepository.findByUsername(username);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            assignRolesIfMissing(existing.getId(), adminRole, superAdminRole);
            log.info("Superadmin bootstrap: User '{}' verified and granted superadmin roles.", username);
            return;
        }

        if (userRepository.existsByEmail(email) || userRepository.existsByPhoneNumber(phone)) {
            log.info("Superadmin bootstrap: Email '{}' or phone '{}' already taken. Skipping bootstrap for '{}'.", email, phone, username);
            return;
        }

        UUID adminId = UuidUtils.generateV4();
        User adminUser = new User(adminId);
        adminUser.setUsername(username);
        adminUser.setEmail(email);
        adminUser.setPhoneNumber(phone);
        adminUser.setPasswordHash(passwordEncoder.encode(password));
        adminUser.setStatus("ACTIVE");
        adminUser.setSystem(false);
        adminUser.setFailedLoginAttempts(0);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser.setPhoneVerifiedAt(Instant.now());

        userRepository.save(adminUser);
        userRoleRepository.save(new UserRole(adminId, adminRole.getId()));
        if (superAdminRole != null && !superAdminRole.getId().equals(adminRole.getId())) {
            userRoleRepository.save(new UserRole(adminId, superAdminRole.getId()));
        }

        log.info("Superadmin bootstrap: Administrator account provisioned for username '{}'.", username);
    }

    private void assignRolesIfMissing(UUID userId, Role adminRole, Role superAdminRole) {
        var userRoles = userRoleRepository.findByUserId(userId);
        boolean hasAdmin = userRoles.stream().anyMatch(ur -> ur.getRoleId().equals(adminRole.getId()));
        boolean hasSuperAdmin = superAdminRole != null && userRoles.stream().anyMatch(ur -> ur.getRoleId().equals(superAdminRole.getId()));

        if (!hasAdmin) {
            userRoleRepository.save(new UserRole(userId, adminRole.getId()));
        }
        if (!hasSuperAdmin && superAdminRole != null && !superAdminRole.getId().equals(adminRole.getId())) {
            userRoleRepository.save(new UserRole(userId, superAdminRole.getId()));
        }
    }
}
