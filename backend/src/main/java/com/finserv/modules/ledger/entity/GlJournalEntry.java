package com.finserv.modules.ledger.entity;

import com.finserv.common.util.UuidUtils;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Immutable general ledger voucher header.
 * Insert-only: all columns have updatable = false; no setters are exposed.
 * Physical immutability enforced at database engine via Flyway trigger trg_gl_journal_no_update.
 */
@Entity
@Table(name = "gl_journal_entries")
public class GlJournalEntry {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private UUID id;

    @Column(name = "journal_reference", length = 50, nullable = false, unique = true, updatable = false)
    private String journalReference;

    @Column(name = "transaction_type", length = 40, nullable = false, updatable = false)
    private String transactionType;

    @Column(name = "posting_date", nullable = false, updatable = false)
    private LocalDate postingDate;

    @Column(name = "description", length = 255, nullable = false, updatable = false)
    private String description;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "reversal_of_journal_id", length = 36, unique = true, updatable = false)
    private UUID reversalOfJournalId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "created_by_user_id", length = 36, nullable = false, updatable = false)
    private UUID createdByUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected GlJournalEntry() {
    }

    public GlJournalEntry(UUID id, String journalReference, String transactionType, LocalDate postingDate,
                          String description, UUID reversalOfJournalId, UUID createdByUserId) {
        this.id = id != null ? id : UuidUtils.generateV7();
        this.journalReference = journalReference;
        this.transactionType = transactionType;
        this.postingDate = postingDate;
        this.description = description;
        this.reversalOfJournalId = reversalOfJournalId;
        this.createdByUserId = createdByUserId;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getJournalReference() {
        return journalReference;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public LocalDate getPostingDate() {
        return postingDate;
    }

    public String getDescription() {
        return description;
    }

    public UUID getReversalOfJournalId() {
        return reversalOfJournalId;
    }

    public UUID getCreatedByUserId() {
        return createdByUserId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GlJournalEntry that = (GlJournalEntry) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
