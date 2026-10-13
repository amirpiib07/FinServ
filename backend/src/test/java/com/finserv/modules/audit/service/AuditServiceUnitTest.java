package com.finserv.modules.audit.service;

import com.finserv.common.exception.ForbiddenOperationException;
import com.finserv.modules.audit.entity.AuditLog;
import com.finserv.modules.audit.repository.AuditLogRepository;
import com.finserv.modules.sequence.service.NumberSequenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuditServiceUnitTest {

    private AuditService auditService;
    private StubAuditLogRepository auditLogRepository;
    private StubNumberSequenceService numberSequenceService;

    static class StubNumberSequenceService extends NumberSequenceService {
        private long counter = 0;

        public StubNumberSequenceService() {
            super(null);
        }

        @Override
        public long getNextValue(String sequenceName) {
            return ++counter;
        }
    }

    static class StubAuditLogRepository implements AuditLogRepository {
        private final Map<Long, AuditLog> store = new HashMap<>();

        @Override
        public AuditLog save(AuditLog entity) {
            store.put(entity.getChainSeq(), entity);
            return entity;
        }

        @Override
        public <S extends AuditLog> Iterable<S> saveAll(Iterable<S> entities) {
            for (S s : entities) save(s);
            return entities;
        }

        @Override
        public Optional<AuditLog> findById(UUID id) {
            return store.values().stream().filter(e -> e.getId().equals(id)).findFirst();
        }

        @Override
        public Optional<AuditLog> findByChainSeq(Long chainSeq) {
            return Optional.ofNullable(store.get(chainSeq));
        }

        @Override
        public List<AuditLog> findAllByOrderByChainSeqAsc() {
            return store.values().stream().sorted(Comparator.comparing(AuditLog::getChainSeq)).toList();
        }

        @Override
        public List<AuditLog> findByEntityTypeAndEntityIdOrderByChainSeqAsc(String entityType, String entityId) {
            return store.values().stream()
                    .filter(e -> e.getEntityType().equals(entityType) && e.getEntityId().equals(entityId))
                    .sorted(Comparator.comparing(AuditLog::getChainSeq)).toList();
        }

        @Override
        public long count() {
            return store.size();
        }
    }

    @BeforeEach
    void setUp() {
        auditLogRepository = new StubAuditLogRepository();
        numberSequenceService = new StubNumberSequenceService();
        auditService = new AuditService(auditLogRepository, numberSequenceService);
    }

    @Test
    @DisplayName("Should reject payloads containing forbidden sensitive fields")
    void shouldRejectPayloadsWithForbiddenFields() {
        String payloadWithPassword = "{\"username\": \"john\", \"password\": \"Secret123!\"}";
        assertThatThrownBy(() -> auditService.validatePayloadSafety(payloadWithPassword))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("forbidden sensitive fields detected");

        String payloadWithHash = "{\"username\": \"john\", \"password_hash\": \"$2a$12$...\"}";
        assertThatThrownBy(() -> auditService.validatePayloadSafety(payloadWithHash))
                .isInstanceOf(ForbiddenOperationException.class);

        String payloadWithTaxId = "{\"tax_identifier_encrypted\": \"U2FsdGVk...\"}";
        assertThatThrownBy(() -> auditService.validatePayloadSafety(payloadWithTaxId))
                .isInstanceOf(ForbiddenOperationException.class);

        // Safe payload should pass with no exception
        String safePayload = "{\"customerId\": \"1001\", \"status\": \"ACTIVE\", \"action\": \"LOGIN\"}";
        auditService.validatePayloadSafety(safePayload);
    }

    @Test
    @DisplayName("Should generate deterministic canonical payload representation")
    void shouldGenerateCanonicalPayload() {
        String canonical = AuditService.buildCanonicalPayload(
                "{\"field1\":\"val1\"}",
                "{\"field1\":\"val2\"}"
        );
        assertThat(canonical).isEqualTo("{\"old\":{\"field1\":\"val1\"},\"new\":{\"field1\":\"val2\"}}");

        String canonicalNulls = AuditService.buildCanonicalPayload(null, null);
        assertThat(canonicalNulls).isEqualTo("{\"old\":null,\"new\":null}");
    }

    @Test
    @DisplayName("Should calculate deterministic SHA-256 hash across all columns")
    void shouldCalculateDeterministicHash() {
        UUID id = UUID.fromString("00000000-0000-0000-0000-000000000001");
        Instant createdAt = Instant.parse("2026-10-14T12:00:00Z");
        UUID actorId = UUID.fromString("00000000-0000-0000-0000-000000000002");

        String hash1 = AuditService.calculateHash(1L, id, createdAt, "USER_LOGIN", "USER",
                id.toString(), actorId, "ROLE_ADMIN", "LOGIN", "127.0.0.1", "Chrome",
                "corr-1", "{\"old\":null,\"new\":null}", AuditService.GENESIS_HASH);

        String hash2 = AuditService.calculateHash(1L, id, createdAt, "USER_LOGIN", "USER",
                id.toString(), actorId, "ROLE_ADMIN", "LOGIN", "127.0.0.1", "Chrome",
                "corr-1", "{\"old\":null,\"new\":null}", AuditService.GENESIS_HASH);

        assertThat(hash1).hasSize(64);
        assertThat(hash1).isEqualTo(hash2);
    }
}
