package com.finserv.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class VerifyOtpRequest {

    @NotNull(message = "Challenge ID is required")
    private UUID challengeId;

    @NotBlank(message = "OTP code is required")
    private String otpCode;

    public VerifyOtpRequest() {
    }

    public VerifyOtpRequest(UUID challengeId, String otpCode) {
        this.challengeId = challengeId;
        this.otpCode = otpCode;
    }

    public UUID getChallengeId() {
        return challengeId;
    }

    public void setChallengeId(UUID challengeId) {
        this.challengeId = challengeId;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }
}
