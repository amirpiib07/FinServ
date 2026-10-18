package com.finserv.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;

public class SendOtpRequest {

    @NotBlank(message = "Contact type is required (EMAIL or PHONE)")
    private String contactType;

    @NotBlank(message = "Target destination is required")
    private String targetDestination;

    private String purpose = "REGISTRATION";

    public SendOtpRequest() {
    }

    public SendOtpRequest(String contactType, String targetDestination, String purpose) {
        this.contactType = contactType;
        this.targetDestination = targetDestination;
        this.purpose = purpose != null ? purpose : "REGISTRATION";
    }

    public String getContactType() {
        return contactType;
    }

    public void setContactType(String contactType) {
        this.contactType = contactType;
    }

    public String getType() {
        return contactType;
    }

    public void setType(String type) {
        if (this.contactType == null || this.contactType.isBlank()) {
            this.contactType = type;
        }
    }

    public String getTargetDestination() {
        return targetDestination;
    }

    public void setTargetDestination(String targetDestination) {
        this.targetDestination = targetDestination;
    }

    public String getDestination() {
        return targetDestination;
    }

    public void setDestination(String destination) {
        if (this.targetDestination == null || this.targetDestination.isBlank()) {
            this.targetDestination = destination;
        }
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}
