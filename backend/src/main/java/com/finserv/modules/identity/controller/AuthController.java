package com.finserv.modules.identity.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.identity.dto.*;
import com.finserv.modules.identity.service.AuthService;
import com.finserv.modules.identity.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication & Identity", description = "Endpoints for user registration, authentication, JWT sessions, and contact verification")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    public AuthController(AuthService authService, OtpService otpService) {
        this.authService = authService;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new customer user", description = "Creates a new user with ROLE_CUSTOMER and status PENDING_VERIFICATION")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        AuthResponse response = authService.register(req, ipAddress, userAgent);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials", description = "Authenticates user and returns JWT access token and rotated refresh token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        AuthResponse response = authService.login(req, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token", description = "Issues a new JWT access token and rotates the refresh token with replay detection")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest req, HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        AuthResponse response = authService.refresh(req, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Log out user session", description = "Revokes refresh token and records audit log entry")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) RefreshTokenRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getUserId() : null;
        authService.logout(req, userId);
        return ResponseEntity.ok(Map.of("message", "Successfully logged out"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile", description = "Returns active user profile, roles, and KYC onboarding status")
    public ResponseEntity<UserSummaryDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserSummaryDto user = authService.getCurrentUserSummary(principal.getUserId());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/verify-contact/send")
    @Operation(summary = "Send single-use contact verification OTP", description = "Generates and dispatches OTP challenge for email or phone (simulated in dev/test)")
    public ResponseEntity<SendOtpResponse> sendOtp(
            @Valid @RequestBody SendOtpRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getUserId() : null;
        SendOtpResponse response = otpService.sendOtp(userId, req);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-contact/confirm")
    @Operation(summary = "Verify contact challenge OTP", description = "Verifies submitted OTP code and updates user contact verification timestamp")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getUserId() : null;
        VerifyOtpResponse response = otpService.verifyOtp(userId, req);
        return ResponseEntity.ok(response);
    }
}
