package com.finserv.common.security;

import com.finserv.modules.identity.entity.Role;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.entity.UserRole;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.identity.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AdminBootstrapRunnerTest {

    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private UserRoleRepository userRoleRepository;
    private PasswordEncoder passwordEncoder;
    private AdminBootstrapRunner runner;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        roleRepository = mock(RoleRepository.class);
        userRoleRepository = mock(UserRoleRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);

        runner = new AdminBootstrapRunner(userRepository, roleRepository, userRoleRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Should skip bootstrapping when ADMIN_USERNAME or ADMIN_PASSWORD are empty")
    void shouldSkipWhenCredentialsMissing() {
        ReflectionTestUtils.setField(runner, "adminUsername", "");
        ReflectionTestUtils.setField(runner, "adminPassword", "");

        runner.run();

        verifyNoInteractions(userRepository, roleRepository, userRoleRepository);
    }

    @Test
    @DisplayName("Should skip bootstrapping when admin user already exists (idempotency)")
    void shouldSkipWhenAdminUserAlreadyExists() {
        ReflectionTestUtils.setField(runner, "adminUsername", "superadmin");
        ReflectionTestUtils.setField(runner, "adminPassword", "Secret123!");
        Role adminRole = new Role(4, "ROLE_ADMIN", "Administrator");
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.existsByUsername("superadmin")).thenReturn(true);

        runner.run();

        verify(userRepository, never()).save(any());
        verify(userRoleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully create admin user and assign ROLE_ADMIN on first run")
    void shouldCreateAdminUserWhenConfigured() {
        ReflectionTestUtils.setField(runner, "adminUsername", "superadmin");
        ReflectionTestUtils.setField(runner, "adminEmail", "admin@finserv.local");
        ReflectionTestUtils.setField(runner, "adminPassword", "Secret123!");

        Role adminRole = new Role(4, "ROLE_ADMIN", "Administrator");
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.existsByUsername("superadmin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@finserv.local")).thenReturn(false);
        when(userRepository.existsByPhoneNumber(anyString())).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("$2a$12$hashedPassword");

        runner.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertThat(savedUser.getUsername()).isEqualTo("superadmin");
        assertThat(savedUser.getEmail()).isEqualTo("admin@finserv.local");
        assertThat(savedUser.getPasswordHash()).isEqualTo("$2a$12$hashedPassword");
        assertThat(savedUser.getStatus()).isEqualTo("ACTIVE");
        assertThat(savedUser.isSystem()).isFalse();

        ArgumentCaptor<UserRole> roleCaptor = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).save(roleCaptor.capture());
        assertThat(roleCaptor.getValue().getRoleId()).isEqualTo(4);
    }
}
