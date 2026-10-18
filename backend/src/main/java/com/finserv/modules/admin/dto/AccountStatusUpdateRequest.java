package com.finserv.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AccountStatusUpdateRequest {

    @NotBlank(message = "Status is required (ACTIVE or FROZEN)")
    @Pattern(regexp = "^(ACTIVE|FROZEN)$", message = "Status must be either ACTIVE or FROZEN")
    private String status;

    @NotBlank(message = "Reason is mandatory for account status modifications")
    private String reason;

    public AccountStatusUpdateRequest() {
    }

    public AccountStatusUpdateRequest(String status, String reason) {
        this.status = status;
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
