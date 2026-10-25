package com.finserv.common.security;

import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.entity.Role;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.identity.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Profile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DemoPersonaBootstrapRunnerProfileTest {

    @Test
    void onlyEnablesDemoBootstrapForDevelopmentAndDemoProfiles() {
        Profile profile = DemoPersonaBootstrapRunner.class.getAnnotation(Profile.class);

        assertThat(profile).isNotNull();
        assertThat(profile.value()).containsExactly("dev & demo");
    }

    @Test
    void requiresLocalDemoPasswordsBeforeAccessingTheDatabase() {
        UserRepository userRepository = mock(UserRepository.class);
        RoleRepository roleRepository = mock(RoleRepository.class);
        UserRoleRepository userRoleRepository = mock(UserRoleRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        DemoPersonaBootstrapRunner runner =
                new DemoPersonaBootstrapRunner(userRepository, roleRepository, userRoleRepository, passwordEncoder);

        ReflectionTestUtils.setField(runner, "demoSuperAdminPassword", "");
        ReflectionTestUtils.setField(runner, "demoOfficerPassword", "");

        assertThatThrownBy(() -> runner.run())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DEMO_SUPER_ADMIN_PASSWORD");
        verifyNoInteractions(userRepository, roleRepository, userRoleRepository, passwordEncoder);
    }

    @Test
    void synchronizesExistingDemoUserPasswordAndClearsItsLockout() {
        UserRepository userRepository = mock(UserRepository.class);
        RoleRepository roleRepository = mock(RoleRepository.class);
        UserRoleRepository userRoleRepository = mock(UserRoleRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        DemoPersonaBootstrapRunner runner =
                new DemoPersonaBootstrapRunner(userRepository, roleRepository, userRoleRepository, passwordEncoder);
        User existingUser = new User(UUID.randomUUID());
        existingUser.setUsername("demo-user");
        existingUser.setPasswordHash("old-encoded-password");
        existingUser.setFailedLoginAttempts(5);
        existingUser.setLockedUntil(Instant.now().plusSeconds(300));
        Role employeeRole = new Role(3, "ROLE_EMPLOYEE", "Employee");
        when(userRepository.findByUsername("demo-user")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("local-test-password", "old-encoded-password")).thenReturn(false);
        when(passwordEncoder.encode("local-test-password")).thenReturn("new-encoded-password");
        when(userRoleRepository.findByUserId(existingUser.getId())).thenReturn(List.of());

        User actual = ReflectionTestUtils.invokeMethod(
                runner, "ensureDemoUser", "demo-user", "demo@example.test", "+910000000000",
                "local-test-password", List.of(employeeRole));

        assertThat(actual).isSameAs(existingUser);
        assertThat(actual.getPasswordHash()).isEqualTo("new-encoded-password");
        assertThat(actual.getFailedLoginAttempts()).isZero();
        assertThat(actual.getLockedUntil()).isNull();
        verify(userRepository).findByUsername("demo-user");
        verify(userRepository).save(existingUser);
        verify(passwordEncoder).encode("local-test-password");
        verify(userRoleRepository).findByUserId(existingUser.getId());
        verify(userRoleRepository).save(org.mockito.ArgumentMatchers.argThat(
                userRole -> employeeRole.getId().equals(userRole.getRoleId())));
    }
}
