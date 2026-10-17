package com.finserv.modules.beneficiary.entity;

import com.finserv.common.model.AuditableEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "beneficiaries")
public class Beneficiary extends AuditableEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "customer_id", length = 36, nullable = false)
    private UUID customerId;

    @Column(name = "payee_type", length = 20, nullable = false)
    private String payeeType;

    @Column(name = "nickname", length = 60, nullable = false)
    private String nickname;

    @Column(name = "beneficiary_name", length = 100, nullable = false)
    private String beneficiaryName;

    @Column(name = "account_number", length = 34, nullable = false)
    private String accountNumber;

    @Column(name = "ifsc_code", length = 20, nullable = false)
    private String ifscCode;

    @Column(name = "bank_name", length = 100, nullable = false)
    private String bankName;

    @Column(name = "daily_transfer_limit", precision = 15, scale = 2)
    private BigDecimal dailyTransferLimit;

    @Column(name = "cooling_off_until")
    private Instant coolingOffUntil;

    @Column(name = "verification_status", length = 20, nullable = false)
    private String verificationStatus = "PENDING_VERIFICATION";

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    public Beneficiary() {
        super();
    }

    public Beneficiary(UUID id) {
        super(id);
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getPayeeType() {
        return payeeType;
    }

    public void setPayeeType(String payeeType) {
        this.payeeType = payeeType;
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

    public Instant getCoolingOffUntil() {
        return coolingOffUntil;
    }

    public void setCoolingOffUntil(Instant coolingOffUntil) {
        this.coolingOffUntil = coolingOffUntil;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
