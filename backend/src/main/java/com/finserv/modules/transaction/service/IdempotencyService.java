package com.finserv.modules.transaction.service;

import com.finserv.common.exception.ConflictException;
import com.finserv.common.exception.ValidationException;
import com.finserv.common.util.UuidUtils;
import com.finserv.modules.transaction.entity.IdempotencyRecord;
import com.finserv.modules.transaction.repository.IdempotencyRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for strict Idempotency-Key enforcement on financial transactions.
 * Prevents double-spending, replay attacks, and duplicate submissions.
 */
@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);

    private final IdempotencyRecordRepository idempotencyRecordRepository;

    public IdempotencyService(IdempotencyRecordRepository idempotencyRecordRepository) {
        this.idempotencyRecordRepository = idempotencyRecordRepository;
    }

    /**
     * Computes deterministic SHA-256 hash of the request payload.
     */
    public String computePayloadHash(String payload) {
        if (payload == null) {
            payload = "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 digest unavailable", e);
        }
    }

    /**
     * Checks if an idempotency key has already been processed or is currently in progress.
     * Returns the existing record if completed with identical payload hash, or a newly saved IN_PROGRESS record.
     * Throws ConflictException on payload mismatch or concurrent in-flight requests.
     */
    @Transactional
    public IdempotencyRecord acquireOrRetrieve(UUID userId, String idempotencyKey, String requestPath, String payload) {
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            throw new ValidationException("Required header 'Idempotency-Key' is missing or blank.");
        }

        String trimmedKey = idempotencyKey.trim();
        String requestHash = computePayloadHash(payload);

        Optional<IdempotencyRecord> existingOpt = idempotencyRecordRepository.findByUserIdAndIdempotencyKey(userId, trimmedKey);

        if (existingOpt.isPresent()) {
            IdempotencyRecord existing = existingOpt.get();

            if ("COMPLETED".equalsIgnoreCase(existing.getStatus())) {
                if (existing.getRequestHash().equals(requestHash)) {
                    log.info("Idempotent request cache hit for key {} and user {}", trimmedKey, userId);
                    return existing;
                } else {
                    log.warn("Idempotency conflict for user {} with key {}: payload hash mismatch", userId, trimmedKey);
                    throw new ConflictException("Idempotency-Key '" + trimmedKey + "' was already used with a different request payload.");
                }
            } else if ("IN_PROGRESS".equalsIgnoreCase(existing.getStatus())) {
                throw new ConflictException("A transaction with Idempotency-Key '" + trimmedKey + "' is currently being processed.");
            } else {
                throw new ConflictException("Previous transaction attempt with Idempotency-Key '" + trimmedKey + "' failed. Please retry with a new key.");
            }
        }

        IdempotencyRecord record = new IdempotencyRecord(UuidUtils.generateV7());
        record.setIdempotencyKey(trimmedKey);
        record.setUserId(userId);
        record.setRequestHash(requestHash);
        record.setRequestPath(requestPath);
        record.setStatus("IN_PROGRESS");
        record.setCreatedAt(Instant.now());
        record.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));

        return idempotencyRecordRepository.save(record);
    }

    @Transactional
    public void markCompleted(IdempotencyRecord record, int httpStatusCode, String responsePayload) {
        record.setHttpStatusCode(httpStatusCode);
        record.setResponsePayload(responsePayload);
        record.setStatus("COMPLETED");
        idempotencyRecordRepository.save(record);
    }
}
