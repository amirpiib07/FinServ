package com.finserv.modules.onboarding.entity;

import com.finserv.common.model.BaseEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "kyc_documents")
public class KycDocument extends BaseEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "customer_id", length = 36)
    private UUID customerId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "application_id", length = 36)
    private UUID applicationId;

    @Column(name = "document_type", length = 40, nullable = false)
    private String documentType;

    @Column(name = "document_number_encrypted", length = 512, nullable = false)
    private String documentNumberEncrypted;

    @Column(name = "document_number_hash", length = 64, nullable = false)
    private String documentNumberHash;

    @Column(name = "key_version", nullable = false)
    private int keyVersion = 1;

    @Column(name = "file_path", length = 255, nullable = false)
    private String filePath;

    @Column(name = "mime_type", length = 80, nullable = false)
    private String mimeType;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "verification_status", length = 30, nullable = false)
    private String verificationStatus = "PENDING";

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "verified_by_user_id", length = 36)
    private UUID verifiedByUserId;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public KycDocument() {
        super();
    }

    public KycDocument(UUID id) {
        super(id);
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getDocumentNumberEncrypted() {
        return documentNumberEncrypted;
    }

    public void setDocumentNumberEncrypted(String documentNumberEncrypted) {
        this.documentNumberEncrypted = documentNumberEncrypted;
    }

    public String getDocumentNumberHash() {
        return documentNumberHash;
    }

    public void setDocumentNumberHash(String documentNumberHash) {
        this.documentNumberHash = documentNumberHash;
    }

    public int getKeyVersion() {
        return keyVersion;
    }

    public void setKeyVersion(int keyVersion) {
        this.keyVersion = keyVersion;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
