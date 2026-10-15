package com.finserv.modules.audit.service;

import com.finserv.common.exception.ForbiddenOperationException;
import com.finserv.common.util.UuidUtils;
import com.finserv.modules.audit.entity.AuditLog;
import com.finserv.modules.audit.repository.AuditLogRepository;
import com.finserv.modules.sequence.service.NumberSequenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Cryptographic Tamper-Evident Audit Logging Service.
 * Implements gapless sequential hash chaining over all stored attributes and payload_canonical.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    public static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    public static final String SEQUENCE_NAME = "audit_chain_seq";

    private static final Pattern FORBIDDEN_FIELDS_PATTERN = Pattern.compile(
            "(?i)\"(password|password_hash|tax_identifier_encrypted|draft_data_encrypted|secret)\"\\s*:"
    );

    private final AuditLogRepository auditLogRepository;
    private final NumberSequenceService numberSequenceService;

    public AuditService(AuditLogRepository auditLogRepository, NumberSequenceService numberSequenceService) {
        this.auditLogRepository = auditLogRepository;
        this.numberSequenceService = numberSequenceService;
    }

    /**
     * Standard in-transaction audit log recording.
     */
    @Transactional
    public AuditLog logEvent(String eventType, String entityType, String entityId,
                             UUID actorUserId, String actorRole, String action,
                             String ipAddress, String userAgent, String correlationId,
                             String oldValueJson, String newValueJson) {
        return recordAuditLog(eventType, entityType, entityId, actorUserId, actorRole, action,
                ipAddress, userAgent, correlationId, oldValueJson, newValueJson);
    }

    /**
     * Convenient in-transaction audit log recording with MDC correlation ID and map serialization.
     */
    @Transactional
    public AuditLog logEvent(String eventType, String entityType, UUID entityId,
                             UUID actorUserId, String actorRole, String action,
                             Map<String, ?> oldValues, Map<String, ?> newValues) {
        String correlationId = org.slf4j.MDC.get("correlationId");
        String oldJson = null;
        String newJson = null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            if (oldValues != null) oldJson = mapper.writeValueAsString(oldValues);
            if (newValues != null) newJson = mapper.writeValueAsString(newValues);
        } catch (Exception e) {
            log.warn("Failed to serialize audit log values", e);
        }
        return recordAuditLog(eventType, entityType, entityId != null ? entityId.toString() : null,
                actorUserId, actorRole, action, "127.0.0.1", "FINServ-Client", correlationId,
                oldJson, newJson);
    }

    /**
     * Autonomous audit log recording in a new transaction (REQUIRES_NEW).
     * Used for failed authorization events, security breaches, and lockout tracking
     * so that audit entries persist even if the parent business transaction rolls back.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog logSecurityEvent(String eventType, String entityType, String entityId,
                                     UUID actorUserId, String actorRole, String action,
                                     String ipAddress, String userAgent, String correlationId,
                                     String oldValueJson, String newValueJson) {
        return recordAuditLog(eventType, entityType, entityId, actorUserId, actorRole, action,
                ipAddress, userAgent, correlationId, oldValueJson, newValueJson);
    }

    private AuditLog recordAuditLog(String eventType, String entityType, String entityId,
                                    UUID actorUserId, String actorRole, String action,
                                    String ipAddress, String userAgent, String correlationId,
                                    String oldValueJson, String newValueJson) {
        // 1. Forbidden fields guard check
        validatePayloadSafety(oldValueJson);
        validatePayloadSafety(newValueJson);

        // 2. Canonical payload normalization
        String payloadCanonical = buildCanonicalPayload(oldValueJson, newValueJson);

        // 3. Obtain next gapless sequence under row lock
        long chainSeq = numberSequenceService.getNextValue(SEQUENCE_NAME);

        // 4. Resolve previous hash
        String previousHash;
        if (chainSeq == 1L) {
            previousHash = GENESIS_HASH;
        } else {
            Optional<AuditLog> previousEntryOpt = auditLogRepository.findByChainSeq(chainSeq - 1);
            if (previousEntryOpt.isEmpty()) {
                throw new IllegalStateException("Audit chain broken: missing sequence " + (chainSeq - 1));
            }
            previousHash = previousEntryOpt.get().getCurrentHash();
        }

        // 5. Build entity with UUIDv7
        UUID id = UuidUtils.generateV7();
        Instant createdAt = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);

        // 6. Calculate full-column cryptographic SHA-256 hash
        String currentHash = calculateHash(chainSeq, id, createdAt, eventType, entityType, entityId,
                actorUserId, actorRole, action, ipAddress, userAgent, correlationId,
                payloadCanonical, previousHash);

        AuditLog entry = new AuditLog(id, chainSeq, eventType, entityType, entityId, actorUserId,
                actorRole, action, ipAddress, userAgent, correlationId, oldValueJson,
                newValueJson, payloadCanonical, previousHash, currentHash, createdAt);

        return auditLogRepository.save(entry);
    }

    /**
     * Rejects payloads containing unmasked credentials or decrypted PII.
     */
    public void validatePayloadSafety(String jsonPayload) {
        if (jsonPayload == null || jsonPayload.isBlank()) {
            return;
        }
        if (FORBIDDEN_FIELDS_PATTERN.matcher(jsonPayload).find()) {
            throw new ForbiddenOperationException("Audit payload security violation: forbidden sensitive fields detected.");
        }
    }

    public static String buildCanonicalPayload(String oldValueJson, String newValueJson) {
        return "{\"old\":" + (oldValueJson != null ? oldValueJson.trim() : "null") +
                ",\"new\":" + (newValueJson != null ? newValueJson.trim() : "null") + "}";
    }

    public static String calculateHash(long chainSeq, UUID id, Instant createdAt,
                                       String eventType, String entityType, String entityId,
                                       UUID actorUserId, String actorRole, String action,
                                       String ipAddress, String userAgent, String correlationId,
                                       String payloadCanonical, String previousHash) {
        Instant normalizedTime = createdAt != null ? createdAt.truncatedTo(java.time.temporal.ChronoUnit.MICROS) : null;
        String rawString = chainSeq + "|" + id + "|" + (normalizedTime != null ? normalizedTime.toString() : "") + "|" +
                eventType + "|" + entityType + "|" + entityId + "|" +
                (actorUserId != null ? actorUserId.toString() : "") + "|" +
                (actorRole != null ? actorRole : "") + "|" + action + "|" +
                (ipAddress != null ? ipAddress : "") + "|" +
                (userAgent != null ? userAgent : "") + "|" +
                (correlationId != null ? correlationId : "") + "|" +
                payloadCanonical + "|" + previousHash;

        return sha256Hex(rawString);
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 digest unavailable", e);
        }
    }

    /**
     * Verifies the cryptographic integrity of the entire audit chain.
     * Returns true if all hashes match and links are unbroken; false if tampering is detected.
     */
    @Transactional(readOnly = true)
    public boolean verifyChain() {
        List<AuditLog> chain = auditLogRepository.findAllByOrderByChainSeqAsc();
        if (chain.isEmpty()) {
            return true;
        }

        String expectedPreviousHash = GENESIS_HASH;
        long expectedSeq = 1L;

        for (AuditLog entry : chain) {
            if (entry.getChainSeq() != expectedSeq) {
                log.error("Audit chain sequence gap detected: expected {}, found {}", expectedSeq, entry.getChainSeq());
                return false;
            }

            if (!expectedPreviousHash.equals(entry.getPreviousHash())) {
                log.error("Audit chain link broken at seq {}: expected prev {}, found prev {}",
                        entry.getChainSeq(), expectedPreviousHash, entry.getPreviousHash());
                return false;
            }

            String recomputedHash = calculateHash(
                    entry.getChainSeq(), entry.getId(), entry.getCreatedAt(),
                    entry.getEventType(), entry.getEntityType(), entry.getEntityId(),
                    entry.getActorUserId(), entry.getActorRole(), entry.getAction(),
                    entry.getIpAddress(), entry.getUserAgent(), entry.getCorrelationId(),
                    entry.getPayloadCanonical(), entry.getPreviousHash()
            );

            if (!recomputedHash.equals(entry.getCurrentHash())) {
                log.error("Audit record tampering detected at seq {}: calculated {}, stored {}",
                        entry.getChainSeq(), recomputedHash, entry.getCurrentHash());
                return false;
            }

            expectedPreviousHash = entry.getCurrentHash();
            expectedSeq++;
        }

        return true;
    }
}
