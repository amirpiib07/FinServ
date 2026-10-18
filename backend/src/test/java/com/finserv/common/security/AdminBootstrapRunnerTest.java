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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    @DisplayName("Should skip user creation and verify roles when admin user already exists (idempotency)")
    void shouldSkipWhenAdminUserAlreadyExists() {
        ReflectionTestUtils.setField(runner, "adminUsername", "superadmin");
        ReflectionTestUtils.setField(runner, "adminPassword", "Secret123!");
        Role adminRole = new Role(4, "ROLE_ADMIN", "Administrator");
        Role superAdminRole = new Role(6, "ROLE_SUPER_ADMIN", "Super Administrator");
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(roleRepository.findByName("ROLE_SUPER_ADMIN")).thenReturn(Optional.of(superAdminRole));
        User existingUser = new User(UUID.randomUUID());
        existingUser.setUsername("superadmin");
        User amitUser = new User(UUID.randomUUID());
        amitUser.setUsername("amit.kumar.singh");

        when(userRepository.findByUsername("superadmin")).thenReturn(Optional.of(existingUser));
        when(userRepository.findByUsername("amit.kumar.singh")).thenReturn(Optional.of(amitUser));
        when(userRoleRepository.findByUserId(any(UUID.class))).thenReturn(List.of(
                new UserRole(existingUser.getId(), 4),
                new UserRole(existingUser.getId(), 6)
        ));

        runner.run();

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully create admin user and assign ROLE_ADMIN and ROLE_SUPER_ADMIN on first run")
    void shouldCreateAdminUserWhenConfigured() {
        ReflectionTestUtils.setField(runner, "adminUsername", "superadmin");
        ReflectionTestUtils.setField(runner, "adminEmail", "admin@finserv.local");
        ReflectionTestUtils.setField(runner, "adminPassword", "Secret123!");

        Role adminRole = new Role(4, "ROLE_ADMIN", "Administrator");
        Role superAdminRole = new Role(6, "ROLE_SUPER_ADMIN", "Super Administrator");
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(roleRepository.findByName("ROLE_SUPER_ADMIN")).thenReturn(Optional.of(superAdminRole));
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhoneNumber(anyString())).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("$2a$12$hashedPassword");

        runner.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(userCaptor.capture());
        User savedUser = userCaptor.getAllValues().get(0);

        assertThat(savedUser.getUsername()).isEqualTo("superadmin");
        assertThat(savedUser.getEmail()).isEqualTo("admin@finserv.local");
        assertThat(savedUser.getPasswordHash()).isEqualTo("$2a$12$hashedPassword");
        assertThat(savedUser.getStatus()).isEqualTo("ACTIVE");
        assertThat(savedUser.isSystem()).isFalse();

        ArgumentCaptor<UserRole> roleCaptor = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository, atLeastOnce()).save(roleCaptor.capture());
        List<Integer> assignedRoleIds = roleCaptor.getAllValues().stream().map(UserRole::getRoleId).toList();
        assertThat(assignedRoleIds).contains(4, 6);
    }
}
