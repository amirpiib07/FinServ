package com.finserv.modules.onboarding.entity;

import com.finserv.common.model.AuditableEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "onboarding_applications")
public class OnboardingApplication extends AuditableEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", length = 36, nullable = false)
    private UUID userId;

    @Column(name = "application_reference", length = 40, nullable = false, unique = true)
    private String applicationReference;

    @Column(name = "current_step", nullable = false)
    private int currentStep = 1;

    @Column(name = "status", length = 30, nullable = false)
    private String status = "DRAFT";

    @Column(name = "draft_data_encrypted", length = 4096)
    private String draftDataEncrypted;

    @Column(name = "key_version", nullable = false)
    private int keyVersion = 1;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "verified_by_user_id", length = 36)
    private UUID verifiedByUserId;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "approved_by_user_id", length = 36)
    private UUID approvedByUserId;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "active_app_marker", insertable = false, updatable = false)
    private String activeAppMarker;

    public OnboardingApplication() {
        super();
    }

    public OnboardingApplication(UUID id) {
        super(id);
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getApplicationReference() {
        return applicationReference;
    }

    public void setApplicationReference(String applicationReference) {
        this.applicationReference = applicationReference;
    }

    public int getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(int currentStep) {
        this.currentStep = currentStep;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDraftDataEncrypted() {
        return draftDataEncrypted;
    }

    public void setDraftDataEncrypted(String draftDataEncrypted) {
        this.draftDataEncrypted = draftDataEncrypted;
    }

    public int getKeyVersion() {
        return keyVersion;
    }

    public void setKeyVersion(int keyVersion) {
        this.keyVersion = keyVersion;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public UUID getVerifiedByUserId() {
        return verifiedByUserId;
    }

    public void setVerifiedByUserId(UUID verifiedByUserId) {
        this.verifiedByUserId = verifiedByUserId;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public UUID getApprovedByUserId() {
        return approvedByUserId;
    }

    public void setApprovedByUserId(UUID approvedByUserId) {
        this.approvedByUserId = approvedByUserId;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getActiveAppMarker() {
        return activeAppMarker;
    }
}
