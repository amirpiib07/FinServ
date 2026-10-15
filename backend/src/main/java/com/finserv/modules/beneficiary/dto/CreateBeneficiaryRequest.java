package com.finserv.modules.beneficiary.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CreateBeneficiaryRequest {

    @NotBlank(message = "Nickname is required")
    @Size(max = 60, message = "Nickname cannot exceed 60 characters")
    private String nickname;

    @NotBlank(message = "Beneficiary name is required")
    @Size(max = 100, message = "Beneficiary name cannot exceed 100 characters")
    private String beneficiaryName;

    @NotBlank(message = "Account number is required")
    @Pattern(regexp = "^[0-9]{9,34}$", message = "Account number must be between 9 and 34 digits")
    private String accountNumber;

    @NotBlank(message = "Please confirm the account number")
    private String confirmAccountNumber;

    @NotBlank(message = "IFSC code is required")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format (e.g. FINS0001001)")
    private String ifscCode;

    @NotBlank(message = "Bank name is required")
    @Size(max = 100, message = "Bank name cannot exceed 100 characters")
    private String bankName;

    @DecimalMin(value = "0.00", message = "Daily transfer limit cannot be negative")
    private BigDecimal dailyTransferLimit;

    public CreateBeneficiaryRequest() {
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getBeneficiaryName() {
        return beneficiaryName;
    }

    public void setBeneficiaryName(String beneficiaryName) {
        this.beneficiaryName = beneficiaryName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getConfirmAccountNumber() {
        return confirmAccountNumber;
    }

    public void setConfirmAccountNumber(String confirmAccountNumber) {
        this.confirmAccountNumber = confirmAccountNumber;
    }

    public String getIfscCode() {
        return ifscCode;
    }

    public void setIfscCode(String ifscCode) {
        this.ifscCode = ifscCode;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public BigDecimal getDailyTransferLimit() {
        return dailyTransferLimit;
    }

    public void setDailyTransferLimit(BigDecimal dailyTransferLimit) {
        this.dailyTransferLimit = dailyTransferLimit;
    }
}
