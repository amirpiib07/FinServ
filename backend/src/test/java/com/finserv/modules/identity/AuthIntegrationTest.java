package com.finserv.modules.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finserv.modules.identity.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should successfully register a new customer user and issue initial tokens")
    void shouldRegisterNewUser() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest request = new RegisterRequest(
                "user_" + randomSuffix,
                "user_" + randomSuffix + "@finserv.local",
                "+9198" + (10000000 + (int)(Math.random() * 89999999)),
                "SecureP@ssw0rd123!"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value(request.getUsername()))
                .andExpect(jsonPath("$.user.email").value(request.getEmail()))
                .andExpect(jsonPath("$.user.status").value("PENDING_VERIFICATION"))
                .andExpect(jsonPath("$.user.roles[0]").value("ROLE_CUSTOMER"))
                .andExpect(jsonPath("$.user.customerVerified").value(false));
    }

    @Test
    @DisplayName("Should reject duplicate username registration with 409 Conflict")
    void shouldRejectDuplicateUsername() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest request = new RegisterRequest(
                "dup_" + randomSuffix,
                "dup1_" + randomSuffix + "@finserv.local",
                "+9198" + (10000000 + (int)(Math.random() * 89999999)),
                "SecureP@ssw0rd123!"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        RegisterRequest duplicate = new RegisterRequest(
                request.getUsername(),
                "dup2_" + randomSuffix + "@finserv.local",
                "+9198" + (10000000 + (int)(Math.random() * 89999999)),
                "SecureP@ssw0rd123!"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials and fail with invalid password")
    void shouldAuthenticateUser() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        String password = "CorrectPassword123!";
        RegisterRequest request = new RegisterRequest(
                "login_" + randomSuffix,
                "login_" + randomSuffix + "@finserv.local",
                "+9198" + (10000000 + (int)(Math.random() * 89999999)),
                password
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Successful login
        LoginRequest loginReq = new LoginRequest(request.getUsername(), password);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());

        // Failed login
        LoginRequest wrongLoginReq = new LoginRequest(request.getUsername(), "WrongPassword!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongLoginReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("Should lock account after 5 consecutive failed login attempts")
    void shouldLockAccountAfterFiveFailures() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        String password = "InitialPassword123!";
        RegisterRequest request = new RegisterRequest(
                "lockout_" + randomSuffix,
                "lockout_" + randomSuffix + "@finserv.local",
                "+9198" + (10000000 + (int)(Math.random() * 89999999)),
                password
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        LoginRequest wrongReq = new LoginRequest(request.getUsername(), "WrongPass");

        // 4 failed attempts
        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongReq)))
                    .andExpect(status().isBadRequest());
        }

        // 5th attempt locks the account
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("locked for 15 minutes")));

        // 6th attempt confirms locked state
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Account is temporarily locked")));
    }

    @Test
    @DisplayName("Should rotate refresh tokens and detect token replay attacks")
    void shouldRotateRefreshTokensAndDetectReplay() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest regReq = new RegisterRequest(
                "refresh_" + randomSuffix,
                "refresh_" + randomSuffix + "@finserv.local",
                "+9198" + (10000000 + (int)(Math.random() * 89999999)),
                "SecretPass123!"
        );

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse regAuth = objectMapper.readValue(regResult.getResponse().getContentAsString(), AuthResponse.class);
        String firstRefreshToken = regAuth.getRefreshToken();

        // Rotate token once
        RefreshTokenRequest refreshReq = new RefreshTokenRequest(firstRefreshToken);
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        AuthResponse rotatedAuth = objectMapper.readValue(refreshResult.getResponse().getContentAsString(), AuthResponse.class);
        String secondRefreshToken = rotatedAuth.getRefreshToken();
        assertThat(secondRefreshToken).isNotEqualTo(firstRefreshToken);

        // Token Replay: Re-submitting firstRefreshToken must be detected as reuse and revoke family
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Compromised session token detected")));

        // The second refresh token in the same family should now also be revoked
        RefreshTokenRequest secondReq = new RefreshTokenRequest(secondRefreshToken);
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Compromised session token detected")));
    }

    @Test
    @DisplayName("Should protect GET /api/v1/auth/me and return profile with valid Bearer token")
    void shouldProtectAndReturnAuthMe() throws Exception {
        // Anonymous request must be forbidden
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isForbidden());

        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest regReq = new RegisterRequest(
                "me_" + randomSuffix,
                "me_" + randomSuffix + "@finserv.local",
                "+9198" + (10000000 + (int)(Math.random() * 89999999)),
                "SecretPass123!"
        );

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse regAuth = objectMapper.readValue(regResult.getResponse().getContentAsString(), AuthResponse.class);

        // Authenticated request
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + regAuth.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(regReq.getUsername()))
                .andExpect(jsonPath("$.email").value(regReq.getEmail()))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_CUSTOMER"))
                .andExpect(jsonPath("$.onboardingStatus").value("NONE"));
    }

    @Test
    @DisplayName("Should generate, send and confirm simulated contact OTP challenges")
    void shouldVerifyContactOtp() throws Exception {
        SendOtpRequest sendReq = new SendOtpRequest("EMAIL", "test.user@finserv.local", "REGISTRATION");

        MvcResult sendResult = mockMvc.perform(post("/api/v1/auth/verify-contact/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challengeId").isNotEmpty())
                .andExpect(jsonPath("$.simulatedOtp").isNotEmpty())
                .andReturn();

        SendOtpResponse sendResp = objectMapper.readValue(sendResult.getResponse().getContentAsString(), SendOtpResponse.class);

        // Wrong code fails
        VerifyOtpRequest wrongReq = new VerifyOtpRequest(sendResp.getChallengeId(), "000000");
        mockMvc.perform(post("/api/v1/auth/verify-contact/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Invalid OTP code")));

        // Correct code succeeds
        VerifyOtpRequest correctReq = new VerifyOtpRequest(sendResp.getChallengeId(), sendResp.getSimulatedOtp());
        mockMvc.perform(post("/api/v1/auth/verify-contact/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));
    }
}
