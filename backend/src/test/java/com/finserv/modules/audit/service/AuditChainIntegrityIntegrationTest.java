package com.finserv.modules.audit.service;

import com.finserv.common.util.UuidUtils;
import com.finserv.modules.audit.entity.AuditLog;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AuditChainIntegrityIntegrationTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Should successfully construct unbroken audit hash chain and verify integrity")
    void shouldConstructAndVerifyValidChain() {
        UUID actorId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        AuditLog log1 = auditService.logEvent(
                "CUSTOMER_REGISTRATION", "CUSTOMER", UuidUtils.generateV4().toString(),
                actorId, "ROLE_ADMIN", "CREATE", "192.168.1.1", "Firefox",
                "corr-audit-01", null, "{\"name\":\"Alice\"}"
        );

        AuditLog log2 = auditService.logEvent(
                "ACCOUNT_OPENING", "ACCOUNT", UuidUtils.generateV4().toString(),
                actorId, "ROLE_ADMIN", "CREATE", "192.168.1.1", "Firefox",
                "corr-audit-02", null, "{\"type\":\"SAVINGS\"}"
        );

        assertThat(log1.getChainSeq()).isNotNull();
        assertThat(log2.getChainSeq()).isEqualTo(log1.getChainSeq() + 1);
        assertThat(log2.getPreviousHash()).isEqualTo(log1.getCurrentHash());

        boolean isValid = auditService.verifyChain();
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should detect database tampering when record attributes are altered")
    void shouldDetectTamperingWhenRecordAltered() {
        UUID actorId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        AuditLog logEntry = auditService.logEvent(
                "SECURITY_ALERT", "SECURITY", UuidUtils.generateV4().toString(),
                actorId, "ROLE_ADMIN", "CREATE", "10.0.0.1", "Safari",
                "corr-tamper-01", null, "{\"alert\":\"ORIGINAL\"}"
        );

        // Verify valid before tampering
        assertThat(auditService.verifyChain()).isTrue();

        // Simulate privileged DB tampering in scratch DB:
        // Temporarily drop trigger, tamper with payload, and restore trigger
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_audit_logs_no_update");
        try {
            jdbcTemplate.update(
                    "UPDATE audit_logs SET payload_canonical = '{\"old\":null,\"new\":{\"alert\":\"MALICIOUS_ALTERATION\"}}' WHERE id = ?",
                    logEntry.getId().toString()
            );

            // verifyChain must now catch the tampering and return false
            boolean isTamperedChainValid = auditService.verifyChain();
            assertThat(isTamperedChainValid).isFalse();
        } finally {
            // Restore immutability trigger
            jdbcTemplate.execute("""
                CREATE TRIGGER trg_audit_logs_no_update BEFORE UPDATE ON audit_logs
                FOR EACH ROW BEGIN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable table: UPDATE not permitted on audit_logs';
                END
            """);
        }
    }
}
