package com.finserv.modules.beneficiary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyBeneficiaryRequest {

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be a 6-digit code")
    private String otpCode;

    public VerifyBeneficiaryRequest() {
    }

    public VerifyBeneficiaryRequest(String otpCode) {
        this.otpCode = otpCode;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }
}
