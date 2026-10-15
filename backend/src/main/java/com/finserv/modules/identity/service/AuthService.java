package com.finserv.modules.identity.service;

import com.finserv.common.exception.DuplicateResourceException;
import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.exception.ValidationException;
import com.finserv.common.security.JwtService;
import com.finserv.modules.audit.service.AuditService;
import com.finserv.modules.identity.dto.*;
import com.finserv.modules.identity.entity.RefreshToken;
import com.finserv.modules.identity.entity.Role;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.entity.UserRole;
import com.finserv.modules.identity.repository.RefreshTokenRepository;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.identity.repository.UserRoleRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.entity.OnboardingApplication;
import com.finserv.modules.onboarding.repository.CustomerRepository;
import com.finserv.modules.onboarding.repository.OnboardingApplicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OnboardingApplicationRepository onboardingApplicationRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       UserRoleRepository userRoleRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       OnboardingApplicationRepository onboardingApplicationRepository,
                       CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.onboardingApplicationRepository = onboardingApplicationRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req, String ipAddress, String userAgent) {
        String username = req.getUsername().trim();
        String email = req.getEmail().trim().toLowerCase();
        String phoneNumber = req.getPhoneNumber().trim();

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email '" + email + "' is already registered");
        }
        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new DuplicateResourceException("Phone number is already associated with an account");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPhoneNumber(phoneNumber);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setStatus("PENDING_VERIFICATION");
        user.setFailedLoginAttempts(0);
        user.setSystem(false);

        user = userRepository.save(user);

        // Assign default customer role
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(new Role(null, "ROLE_CUSTOMER", "Standard Retail Customer")));
        userRoleRepository.save(new UserRole(user.getId(), customerRole.getId()));

        List<String> roles = List.of(customerRole.getName());

        // Audit log registration
        auditService.logEvent(
                "USER_REGISTERED",
                "USER",
                user.getId(),
                user.getId(),
                "ROLE_CUSTOMER",
                "CREATE",
                null,
                Map.of("username", username, "email", email, "ip", ipAddress != null ? ipAddress : "unknown")
        );

        log.info("Registered user with id: {}", user.getId());

        // Issue initial access and refresh tokens
        return createAuthSession(user, roles);
    }

    @Transactional(noRollbackFor = ValidationException.class)
    public AuthResponse login(LoginRequest req, String ipAddress, String userAgent) {
        String identifier = req.getUsernameOrEmail().trim();

        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase()))
                .orElseThrow(() -> new ValidationException("Invalid username or password"));

        // Check account lock status
        if (user.getLockedUntil() != null) {
            if (user.getLockedUntil().isAfter(Instant.now())) {
                auditService.logEvent(
                        "LOGIN_LOCKED_ATTEMPT",
                        "USER",
                        user.getId(),
                        user.getId(),
                        "ROLE_CUSTOMER",
                        "LOGIN_FAILED",
                        null,
                        Map.of("username", user.getUsername(), "lockedUntil", user.getLockedUntil().toString())
                );
                throw new ValidationException("Account is temporarily locked due to excessive failed attempts. Please try again later.");
            } else {
                user.setLockedUntil(null);
                user.setFailedLoginAttempts(0);
            }
        }

        // Verify password
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            int failedAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failedAttempts);

            if (failedAttempts >= 5) {
                user.setLockedUntil(Instant.now().plus(15, ChronoUnit.MINUTES));
                userRepository.save(user);

                auditService.logEvent(
                        "ACCOUNT_LOCKED",
                        "USER",
                        user.getId(),
                        user.getId(),
                        "ROLE_CUSTOMER",
                        "UPDATE",
                        null,
                        Map.of("username", user.getUsername(), "failedAttempts", failedAttempts)
                );
                throw new ValidationException("Account locked for 15 minutes due to 5 consecutive failed login attempts.");
            }

            userRepository.save(user);

            auditService.logEvent(
                    "LOGIN_FAILED",
                    "USER",
                    user.getId(),
                    user.getId(),
                    "ROLE_CUSTOMER",
                    "LOGIN_FAILED",
                    null,
                    Map.of("username", user.getUsername(), "failedAttempts", failedAttempts)
            );
            throw new ValidationException("Invalid username or password");
        }

        // Reset failed attempts upon successful login
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        List<String> roles = resolveRoles(user.getId());

        auditService.logEvent(
                "LOGIN_SUCCESS",
                "USER",
                user.getId(),
                user.getId(),
                roles.isEmpty() ? "ROLE_CUSTOMER" : roles.get(0),
                "LOGIN",
                null,
                Map.of("username", user.getUsername(), "ip", ipAddress != null ? ipAddress : "unknown")
        );

        return createAuthSession(user, roles);
    }

    @Transactional(noRollbackFor = ValidationException.class)
    public AuthResponse refresh(RefreshTokenRequest req, String ipAddress, String userAgent) {
        String rawToken = req.getRefreshToken().trim();
        String tokenHash = jwtService.hashToken(rawToken);

        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ValidationException("Invalid refresh token"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ValidationException("Refresh token has expired. Please sign in again.");
        }

        // Token Replay Detection: If token is already revoked, revoke the whole family
        if (token.isRevoked()) {
            List<RefreshToken> family = refreshTokenRepository.findByTokenFamilyId(token.getTokenFamilyId());
            for (RefreshToken t : family) {
                t.setRevoked(true);
            }
            refreshTokenRepository.saveAll(family);

            auditService.logEvent(
                    "REFRESH_TOKEN_REPLAY_ATTACK",
                    "REFRESH_TOKEN",
                    token.getId(),
                    token.getUserId(),
                    "ROLE_CUSTOMER",
                    "UPDATE",
                    null,
                    Map.of("familyId", token.getTokenFamilyId().toString())
            );

            throw new ValidationException("Compromised session token detected. All associated sessions have been revoked. Please sign in again.");
        }

        // Revoke current token and generate new one in same family (Rotation)
        token.setRevoked(true);

        String newRawToken = jwtService.generateRefreshToken();
        String newTokenHash = jwtService.hashToken(newRawToken);

        RefreshToken nextToken = new RefreshToken();
        nextToken.setUserId(token.getUserId());
        nextToken.setTokenFamilyId(token.getTokenFamilyId());
        nextToken.setTokenHash(newTokenHash);
        nextToken.setExpiresAt(Instant.now().plus(jwtService.getRefreshTokenExpirationDays(), ChronoUnit.DAYS));
        nextToken.setRevoked(false);
        nextToken = refreshTokenRepository.save(nextToken);

        token.setReplacedByTokenId(nextToken.getId());
        refreshTokenRepository.save(token);

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<String> roles = resolveRoles(user.getId());
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername(), roles);

        return new AuthResponse(
                accessToken,
                newRawToken,
                jwtService.getAccessTokenExpirationMinutes() * 60,
                buildUserSummary(user, roles)
        );
    }

    @Transactional
    public void logout(RefreshTokenRequest req, UUID userId) {
        if (req != null && req.getRefreshToken() != null && !req.getRefreshToken().isBlank()) {
            String tokenHash = jwtService.hashToken(req.getRefreshToken().trim());
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }

        if (userId != null) {
            auditService.logEvent(
                    "LOGOUT",
                    "USER",
                    userId,
                    userId,
                    "ROLE_CUSTOMER",
                    "LOGOUT",
                    null,
                    null
            );
        }
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUserSummary(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<String> roles = resolveRoles(userId);
        return buildUserSummary(user, roles);
    }

    private AuthResponse createAuthSession(User user, List<String> roles) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername(), roles);
        String rawRefreshToken = jwtService.generateRefreshToken();
        String tokenHash = jwtService.hashToken(rawRefreshToken);

        RefreshToken rt = new RefreshToken();
        rt.setUserId(user.getId());
        rt.setTokenFamilyId(UUID.randomUUID());
        rt.setTokenHash(tokenHash);
        rt.setExpiresAt(Instant.now().plus(jwtService.getRefreshTokenExpirationDays(), ChronoUnit.DAYS));
        rt.setRevoked(false);
        refreshTokenRepository.save(rt);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                jwtService.getAccessTokenExpirationMinutes() * 60,
                buildUserSummary(user, roles)
        );
    }

    private List<String> resolveRoles(UUID userId) {
        List<UserRole> userRoles = userRoleRepository.findByUserId(userId);
        if (userRoles.isEmpty()) {
            return List.of("ROLE_CUSTOMER");
        }
        List<String> roleNames = new ArrayList<>();
        for (UserRole ur : userRoles) {
            roleRepository.findById(ur.getRoleId())
                    .ifPresent(r -> roleNames.add(r.getName()));
        }
        return roleNames.isEmpty() ? List.of("ROLE_CUSTOMER") : roleNames;
    }

    private UserSummaryDto buildUserSummary(User user, List<String> roles) {
        UserSummaryDto dto = new UserSummaryDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setStatus(user.getStatus());
        dto.setRoles(roles);
        dto.setEmailVerified(user.getEmailVerifiedAt() != null);
        dto.setPhoneVerified(user.getPhoneVerifiedAt() != null);

        // Check customer verification status
        Optional<Customer> customerOpt = customerRepository.findByUserId(user.getId());
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            dto.setCustomerNumber(customer.getCustomerNumber());
            dto.setCustomerVerified("VERIFIED".equalsIgnoreCase(customer.getKycStatus()));
        } else {
            dto.setCustomerVerified(false);
        }

        // Check open or latest onboarding application
        Optional<OnboardingApplication> openApp = onboardingApplicationRepository
                .findByUserIdAndStatusIn(user.getId(), List.of("DRAFT", "SUBMITTED", "UNDER_REVIEW"));

        if (openApp.isPresent()) {
            dto.setOnboardingStatus(openApp.get().getStatus());
            dto.setOnboardingStep(openApp.get().getCurrentStep());
        } else if (dto.isCustomerVerified()) {
            dto.setOnboardingStatus("APPROVED");
            dto.setOnboardingStep(5);
        } else {
            dto.setOnboardingStatus("NONE");
            dto.setOnboardingStep(1);
        }

        return dto;
    }
}
