package com.finserv.modules.identity.dto;

import java.util.UUID;

public class SendOtpResponse {

    private UUID challengeId;
    private String contactType;
    private String targetDestination;
    private String maskedDestination;
    private long expiresInSeconds;
    private String simulatedOtp;

    public SendOtpResponse() {
    }

    public SendOtpResponse(UUID challengeId, String contactType, String targetDestination,
                           String maskedDestination, long expiresInSeconds, String simulatedOtp) {
        this.challengeId = challengeId;
        this.contactType = contactType;
        this.targetDestination = targetDestination;
        this.maskedDestination = maskedDestination;
        this.expiresInSeconds = expiresInSeconds;
        this.simulatedOtp = simulatedOtp;
    }

    public UUID getChallengeId() {
        return challengeId;
    }

    public void setChallengeId(UUID challengeId) {
        this.challengeId = challengeId;
    }

    public UUID getReferenceId() {
        return challengeId;
    }

    public void setReferenceId(UUID referenceId) {
        if (this.challengeId == null) {
            this.challengeId = referenceId;
        }
    }

    public String getContactType() {
        return contactType;
    }

    public void setContactType(String contactType) {
        this.contactType = contactType;
    }

    public String getTargetDestination() {
        return targetDestination;
    }

    public void setTargetDestination(String targetDestination) {
        this.targetDestination = targetDestination;
    }

    public String getMaskedDestination() {
        return maskedDestination;
    }

    public void setMaskedDestination(String maskedDestination) {
        this.maskedDestination = maskedDestination;
    }

    public long getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(long expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }

    public String getSimulatedOtp() {
        return simulatedOtp;
    }

    public void setSimulatedOtp(String simulatedOtp) {
        this.simulatedOtp = simulatedOtp;
    }

    public String getCode() {
        return simulatedOtp;
    }

    public void setCode(String code) {
        if (this.simulatedOtp == null) {
            this.simulatedOtp = code;
        }
    }

    public String getDebugOtpCode() {
        return simulatedOtp;
    }

    public void setDebugOtpCode(String debugOtpCode) {
        if (this.simulatedOtp == null) {
            this.simulatedOtp = debugOtpCode;
        }
    }
}
