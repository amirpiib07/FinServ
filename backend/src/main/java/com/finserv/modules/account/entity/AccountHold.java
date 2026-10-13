package com.finserv.modules.account.entity;

import com.finserv.common.model.AuditableEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_holds")
public class AccountHold extends AuditableEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "account_id", length = 36, nullable = false)
    private UUID accountId;

    @Column(name = "hold_reference", length = 50, nullable = false, unique = true)
    private String holdReference;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "reason", length = 150, nullable = false)
    private String reason;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "expires_at")
    private Instant expiresAt;

    public AccountHold() {
        super();
    }

    public AccountHold(UUID id) {
        super(id);
    }

    public UUID getAccountId() {
        return accountId;
    }

    public void setAccountId(UUID accountId) {
        this.accountId = accountId;
    }

    public String getHoldReference() {
        return holdReference;
    }

    public void setHoldReference(String holdReference) {
        this.holdReference = holdReference;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
