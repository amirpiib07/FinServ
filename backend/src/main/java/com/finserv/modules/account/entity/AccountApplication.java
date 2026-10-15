package com.finserv.modules.account.entity;

import com.finserv.common.model.BaseEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_applications")
public class AccountApplication extends BaseEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "customer_id", length = 36, nullable = false)
    private UUID customerId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "product_id", length = 36, nullable = false)
    private UUID productId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "branch_id", length = 36)
    private UUID branchId;

    @Column(name = "application_number", length = 30, nullable = false, unique = true)
    private String applicationNumber;

    @Column(name = "initial_deposit_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal initialDepositAmount = BigDecimal.ZERO.setScale(2);

    @Column(name = "application_status", length = 30, nullable = false)
    private String applicationStatus = "SUBMITTED";

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "reviewed_by_user_id", length = 36)
    private UUID reviewedByUserId;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "created_account_id", length = 36)
    private UUID createdAccountId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AccountApplication() {
        super();
    }

    public AccountApplication(UUID id) {
        super(id);
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

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    public String getApplicationNumber() {
        return applicationNumber;
    }

    public void setApplicationNumber(String applicationNumber) {
        this.applicationNumber = applicationNumber;
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

    public UUID getReviewedByUserId() {
        return reviewedByUserId;
    }

    public void setReviewedByUserId(UUID reviewedByUserId) {
        this.reviewedByUserId = reviewedByUserId;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
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
