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
        if (adminRoleOpt.isEmpty()) {
            log.warn("Superadmin bootstrap: ROLE_ADMIN not found in roles table. Ensure migrations have run. Skipping.");
            return;
        }
        Role adminRole = adminRoleOpt.get();

        if (userRepository.existsByUsername(adminUsername)) {
            log.info("Superadmin bootstrap: User '{}' already exists. Skipping initialization.", adminUsername);
            return;
        }

        String email = (adminEmail != null && !adminEmail.isBlank()) ? adminEmail : "admin@finserv.local";
        if (userRepository.existsByEmail(email)) {
            log.info("Superadmin bootstrap: User with email '{}' already exists. Skipping initialization.", email);
            return;
        }

        String phone = "+910000000099";
        if (userRepository.existsByPhoneNumber(phone)) {
            log.info("Superadmin bootstrap: User with phone '{}' already exists. Skipping initialization.", phone);
            return;
        }

        UUID adminId = UuidUtils.generateV4();
        User adminUser = new User(adminId);
        adminUser.setUsername(adminUsername);
        adminUser.setEmail(email);
        adminUser.setPhoneNumber("+910000000099");
        adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
        adminUser.setStatus("ACTIVE");
        adminUser.setSystem(false);
        adminUser.setFailedLoginAttempts(0);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser.setPhoneVerifiedAt(Instant.now());

        userRepository.save(adminUser);
        userRoleRepository.save(new UserRole(adminId, adminRole.getId()));

        log.info("Superadmin bootstrap: Initial administrator account successfully provisioned for username '{}'.", adminUsername);
    }
}
