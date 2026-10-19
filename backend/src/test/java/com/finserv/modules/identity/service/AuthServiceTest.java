package com.finserv.modules.identity.service;

import com.finserv.common.security.JwtService;
import com.finserv.modules.audit.service.AuditService;
import com.finserv.modules.identity.dto.UserSummaryDto;
import com.finserv.modules.identity.entity.Role;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.entity.UserRole;
import com.finserv.modules.identity.repository.RefreshTokenRepository;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.identity.repository.UserRoleRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.repository.CustomerRepository;
import com.finserv.modules.onboarding.repository.OnboardingApplicationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Test
    void currentUserSummaryIncludesCustomerName() {
        UUID userId = UUID.randomUUID();
        User user = new User(userId);
        user.setUsername("customer-login");
        user.setEmail("customer@example.test");
        user.setPhoneNumber("+910000000000");
        user.setStatus("ACTIVE");

        Customer customer = new Customer();
        customer.setCustomerNumber("CUST-1001");
        customer.setFirstName("Rahul");
        customer.setLastName("Sharma");
        customer.setKycStatus("VERIFIED");

        UserRepository users = mock(UserRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        UserRoleRepository userRoles = mock(UserRoleRepository.class);
        CustomerRepository customers = mock(CustomerRepository.class);
        OnboardingApplicationRepository applications = mock(OnboardingApplicationRepository.class);

        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(userRoles.findByUserId(userId)).thenReturn(List.of(new UserRole(userId, 1)));
        when(roles.findById(1)).thenReturn(Optional.of(new Role(1, "ROLE_CUSTOMER", "Customer")));
        when(customers.findByUserId(userId)).thenReturn(Optional.of(customer));
        when(applications.findByUserIdAndStatusIn(
                userId, List.of("DRAFT", "SUBMITTED", "UNDER_REVIEW")
        )).thenReturn(Optional.empty());

        AuthService authService = new AuthService(
                users,
                roles,
                userRoles,
                mock(RefreshTokenRepository.class),
                applications,
                customers,
                mock(PasswordEncoder.class),
                mock(JwtService.class),
                mock(AuditService.class)
        );

        UserSummaryDto summary = authService.getCurrentUserSummary(userId);

        assertThat(summary.getFirstName()).isEqualTo("Rahul");
        assertThat(summary.getLastName()).isEqualTo("Sharma");
        assertThat(summary.getUsername()).isEqualTo("customer-login");
    }
}
