package com.finserv.modules.transaction.entity;

import com.finserv.common.model.BaseEntity;
import com.finserv.common.util.UuidUtils;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class Transaction extends BaseEntity {

    @Column(name = "transaction_reference", length = 40, nullable = false, unique = true)
    private String transactionReference;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "from_account_id", length = 36)
    private UUID fromAccountId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "to_account_id", length = 36)
    private UUID toAccountId;

    @Column(name = "transaction_type", length = 40, nullable = false)
    private String transactionType;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "fee_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal feeAmount = BigDecimal.ZERO.setScale(2);

    @Column(name = "currency", length = 3, nullable = false)
    private String currency = "INR";

    @Column(name = "from_account_balance_after", precision = 15, scale = 2)
    private BigDecimal fromAccountBalanceAfter;

    @Column(name = "to_account_balance_after", precision = 15, scale = 2)
    private BigDecimal toAccountBalanceAfter;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "PENDING";

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "reversal_of_transaction_id", length = 36, unique = true)
    private UUID reversalOfTransactionId;

    @Column(name = "channel", length = 30, nullable = false)
    private String channel = "WEB";

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "initiated_by_user_id", length = 36)
    private UUID initiatedByUserId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "branch_id", length = 36)
    private UUID branchId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "idempotency_record_id", length = 36, unique = true)
    private UUID idempotencyRecordId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "journal_entry_id", length = 36)
    private UUID journalEntryId;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    public Transaction() {
        super(UuidUtils.generateV7());
    }

    public Transaction(UUID id) {
        super(id != null ? id : UuidUtils.generateV7());
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public UUID getFromAccountId() {
        return fromAccountId;
    }

    public void setFromAccountId(UUID fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public UUID getToAccountId() {
        return toAccountId;
    }

    public void setToAccountId(UUID toAccountId) {
        this.toAccountId = toAccountId;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getFeeAmount() {
        return feeAmount;
    }

    public void setFeeAmount(BigDecimal feeAmount) {
        this.feeAmount = feeAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getFromAccountBalanceAfter() {
        return fromAccountBalanceAfter;
    }

    public void setFromAccountBalanceAfter(BigDecimal fromAccountBalanceAfter) {
        this.fromAccountBalanceAfter = fromAccountBalanceAfter;
    }

    public BigDecimal getToAccountBalanceAfter() {
        return toAccountBalanceAfter;
    }

    public void setToAccountBalanceAfter(BigDecimal toAccountBalanceAfter) {
        this.toAccountBalanceAfter = toAccountBalanceAfter;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public UUID getReversalOfTransactionId() {
        return reversalOfTransactionId;
    }

    public void setReversalOfTransactionId(UUID reversalOfTransactionId) {
        this.reversalOfTransactionId = reversalOfTransactionId;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public UUID getInitiatedByUserId() {
        return initiatedByUserId;
    }

    public void setInitiatedByUserId(UUID initiatedByUserId) {
        this.initiatedByUserId = initiatedByUserId;
    }

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    public UUID getIdempotencyRecordId() {
        return idempotencyRecordId;
    }

    public void setIdempotencyRecordId(UUID idempotencyRecordId) {
        this.idempotencyRecordId = idempotencyRecordId;
    }

    public UUID getJournalEntryId() {
        return journalEntryId;
    }

    public void setJournalEntryId(UUID journalEntryId) {
        this.journalEntryId = journalEntryId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
