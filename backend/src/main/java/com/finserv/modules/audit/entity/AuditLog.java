package com.finserv.modules.audit.entity;

import com.finserv.common.util.UuidUtils;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Immutable cryptographic tamper-evident audit log.
 * Insert-only: updatable = false across all fields; no setters exposed.
 * Engine-level immutability enforced by Flyway trigger trg_audit_logs_no_update.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private UUID id;

    @Column(name = "chain_seq", nullable = false, unique = true, updatable = false)
    private Long chainSeq;

    @Column(name = "event_type", length = 60, nullable = false, updatable = false)
    private String eventType;

    @Column(name = "entity_type", length = 60, nullable = false, updatable = false)
    private String entityType;

    @Column(name = "entity_id", length = 36, nullable = false, updatable = false)
    private String entityId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "actor_user_id", length = 36, updatable = false)
    private UUID actorUserId;

    @Column(name = "actor_role", length = 50, updatable = false)
    private String actorRole;

    @Column(name = "action", length = 20, nullable = false, updatable = false)
    private String action;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @Column(name = "user_agent", length = 255, updatable = false)
    private String userAgent;

    @Column(name = "correlation_id", length = 64, updatable = false)
    private String correlationId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_value_json", columnDefinition = "JSON", updatable = false)
    private String oldValueJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_value_json", columnDefinition = "JSON", updatable = false)
    private String newValueJson;

    @Column(name = "payload_canonical", columnDefinition = "LONGTEXT", nullable = false, updatable = false)
    private String payloadCanonical;

    @Column(name = "previous_hash", length = 64, nullable = false, updatable = false)
    private String previousHash;

    @Column(name = "current_hash", length = 64, nullable = false, updatable = false)
    private String currentHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuditLog() {
    }

    public AuditLog(UUID id, Long chainSeq, String eventType, String entityType, String entityId,
                    UUID actorUserId, String actorRole, String action, String ipAddress, String userAgent,
                    String correlationId, String oldValueJson, String newValueJson, String payloadCanonical,
                    String previousHash, String currentHash, Instant createdAt) {
        this.id = id != null ? id : UuidUtils.generateV7();
        this.chainSeq = chainSeq;
        this.eventType = eventType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.actorUserId = actorUserId;
        this.actorRole = actorRole;
        this.action = action;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.correlationId = correlationId;
        this.oldValueJson = oldValueJson;
        this.newValueJson = newValueJson;
        this.payloadCanonical = payloadCanonical;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.createdAt = createdAt != null ? createdAt.truncatedTo(java.time.temporal.ChronoUnit.MICROS)
                : Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);
    }

    public UUID getId() {
        return id;
    }

    public Long getChainSeq() {
        return chainSeq;
    }

    public String getEventType() {
        return eventType;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public UUID getActorUserId() {
        return actorUserId;
    }

    public String getActorRole() {
        return actorRole;
    }

    public String getAction() {
        return action;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public String getOldValueJson() {
        return oldValueJson;
    }

    public String getNewValueJson() {
        return newValueJson;
    }

    public String getPayloadCanonical() {
        return payloadCanonical;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public String getCurrentHash() {
        return currentHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuditLog auditLog = (AuditLog) o;
        return Objects.equals(id, auditLog.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
