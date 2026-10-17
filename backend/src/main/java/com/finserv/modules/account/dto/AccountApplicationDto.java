package com.finserv.modules.account.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class AccountApplicationDto {
    private UUID id;
    private String applicationNumber;
    private UUID customerId;
    private UUID productId;
    private String productName;
    private String productCode;
    private UUID branchId;
    private String branchName;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal initialDepositAmount;
    private String applicationStatus;
    private String rejectionReason;
    private UUID createdAccountId;
    private Instant createdAt;

    public AccountApplicationDto() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getApplicationNumber() {
        return applicationNumber;
    }

    public void setApplicationNumber(String applicationNumber) {
        this.applicationNumber = applicationNumber;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public BigDecimal getInitialDepositAmount() {
        return initialDepositAmount;
    }

    public void setInitialDepositAmount(BigDecimal initialDepositAmount) {
        this.initialDepositAmount = initialDepositAmount;
    }

    public String getApplicationStatus() {
        return applicationStatus;
    }

    public void setApplicationStatus(String applicationStatus) {
        this.applicationStatus = applicationStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public UUID getCreatedAccountId() {
        return createdAccountId;
    }

    public void setCreatedAccountId(UUID createdAccountId) {
        this.createdAccountId = createdAccountId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
