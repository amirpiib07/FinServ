package com.finserv.modules.ledger.entity;

import com.finserv.common.util.UuidUtils;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Immutable general ledger posting row (Debit or Credit).
 * Insert-only: updatable = false on all columns; no setters exposed.
 * Engine-level immutability enforced via trg_gl_postings_no_update.
 */
@Entity
@Table(name = "gl_ledger_postings")
public class GlLedgerPosting {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private UUID id;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "journal_entry_id", length = 36, nullable = false, updatable = false)
    private UUID journalEntryId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "gl_account_id", length = 36, nullable = false, updatable = false)
    private UUID glAccountId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "customer_account_id", length = 36, updatable = false)
    private UUID customerAccountId;

    @Column(name = "entry_type", length = 10, nullable = false, updatable = false)
    private String entryType;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false, updatable = false)
    private BigDecimal amount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected GlLedgerPosting() {
    }

    public GlLedgerPosting(UUID id, UUID journalEntryId, UUID glAccountId, UUID customerAccountId,
                           String entryType, BigDecimal amount) {
        this.id = id != null ? id : UuidUtils.generateV7();
        this.journalEntryId = journalEntryId;
        this.glAccountId = glAccountId;
        this.customerAccountId = customerAccountId;
        this.entryType = entryType;
        this.amount = amount;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getJournalEntryId() {
        return journalEntryId;
    }

    public UUID getGlAccountId() {
        return glAccountId;
    }

    public UUID getCustomerAccountId() {
        return customerAccountId;
    }

    public String getEntryType() {
        return entryType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GlLedgerPosting that = (GlLedgerPosting) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
