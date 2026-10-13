package com.finserv.modules.approval.entity;

import com.finserv.common.model.BaseEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approval_requests")
public class ApprovalRequest extends BaseEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "maker_user_id", length = 36, nullable = false)
    private UUID makerUserId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "checker_user_id", length = 36)
    private UUID checkerUserId;

    @Column(name = "entity_type", length = 50, nullable = false)
    private String entityType;

    @Column(name = "entity_id", length = 36, nullable = false)
    private String entityId;

    @Column(name = "action_type", length = 40, nullable = false)
    private String actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_json", columnDefinition = "JSON", nullable = false)
    private String payloadJson;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "PENDING";

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ApprovalRequest() {
        super();
    }

    public ApprovalRequest(UUID id) {
        super(id);
    }

    public UUID getMakerUserId() {
        return makerUserId;
    }

    public void setMakerUserId(UUID makerUserId) {
        this.makerUserId = makerUserId;
    }

    public UUID getCheckerUserId() {
        return checkerUserId;
    }

    public void setCheckerUserId(UUID checkerUserId) {
        this.checkerUserId = checkerUserId;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(Instant decidedAt) {
        this.decidedAt = decidedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
