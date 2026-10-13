package com.finserv.modules.database;

import com.finserv.common.util.UuidUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class ImmutabilityTriggersIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @Transactional
    @DisplayName("Should block UPDATE on audit_logs via trg_audit_logs_no_update trigger")
    void shouldBlockUpdateOnAuditLogs() {
        String logId = UuidUtils.generateV7().toString();
        long seq = System.currentTimeMillis();

        jdbcTemplate.update(
                """
                INSERT INTO audit_logs (id, chain_seq, event_type, entity_type, entity_id, action, payload_canonical, previous_hash, current_hash, created_at)
                VALUES (?, ?, 'TEST', 'USER', '1', 'CREATE', '{}', '000', '111', NOW(6))
                """,
                logId, seq
        );

        assertThatThrownBy(() -> jdbcTemplate.update("UPDATE audit_logs SET event_type = 'TAMPERED' WHERE id = ?", logId))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("Immutable table: UPDATE not permitted on audit_logs");
    }

    @Test
    @Transactional
    @DisplayName("Should block DELETE on audit_logs via trg_audit_logs_no_delete trigger")
    void shouldBlockDeleteOnAuditLogs() {
        String logId = UuidUtils.generateV7().toString();
        long seq = System.currentTimeMillis();

        jdbcTemplate.update(
                """
                INSERT INTO audit_logs (id, chain_seq, event_type, entity_type, entity_id, action, payload_canonical, previous_hash, current_hash, created_at)
                VALUES (?, ?, 'TEST', 'USER', '1', 'CREATE', '{}', '000', '111', NOW(6))
                """,
                logId, seq
        );

        assertThatThrownBy(() -> jdbcTemplate.update("DELETE FROM audit_logs WHERE id = ?", logId))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("Immutable table: DELETE not permitted on audit_logs");
    }

    @Test
    @Transactional
    @DisplayName("Should block UPDATE on gl_journal_entries via trg_gl_journal_no_update trigger")
    void shouldBlockUpdateOnGlJournalEntries() {
        String journalId = UuidUtils.generateV7().toString();
        String ref = "JRNL_" + System.currentTimeMillis();

        jdbcTemplate.update(
                """
                INSERT INTO gl_journal_entries (id, journal_reference, transaction_type, posting_date, description, created_by_user_id)
                VALUES (?, ?, 'TRANSFER', CURDATE(), 'Test journal', '00000000-0000-0000-0000-000000000001')
                """,
                journalId, ref
        );

        assertThatThrownBy(() -> jdbcTemplate.update("UPDATE gl_journal_entries SET description = 'TAMPERED' WHERE id = ?", journalId))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("Immutable table: UPDATE not permitted on gl_journal_entries");
    }

    @Test
    @Transactional
    @DisplayName("Should block DELETE on gl_journal_entries via trg_gl_journal_no_delete trigger")
    void shouldBlockDeleteOnGlJournalEntries() {
        String journalId = UuidUtils.generateV7().toString();
        String ref = "JRNL_DEL_" + System.currentTimeMillis();

        jdbcTemplate.update(
                """
                INSERT INTO gl_journal_entries (id, journal_reference, transaction_type, posting_date, description, created_by_user_id)
                VALUES (?, ?, 'TRANSFER', CURDATE(), 'Test journal', '00000000-0000-0000-0000-000000000001')
                """,
                journalId, ref
        );

        assertThatThrownBy(() -> jdbcTemplate.update("DELETE FROM gl_journal_entries WHERE id = ?", journalId))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("Immutable table: DELETE not permitted on gl_journal_entries");
    }

    @Test
    @Transactional
    @DisplayName("Should block UPDATE on gl_ledger_postings via trg_gl_postings_no_update trigger")
    void shouldBlockUpdateOnGlLedgerPostings() {
        String journalId = UuidUtils.generateV7().toString();
        String ref = "JRNL_PST_" + System.currentTimeMillis();
        jdbcTemplate.update(
                """
                INSERT INTO gl_journal_entries (id, journal_reference, transaction_type, posting_date, description, created_by_user_id)
                VALUES (?, ?, 'TRANSFER', CURDATE(), 'Test journal', '00000000-0000-0000-0000-000000000001')
                """,
                journalId, ref
        );

        String postingId = UuidUtils.generateV7().toString();
        jdbcTemplate.update(
                """
                INSERT INTO gl_ledger_postings (id, journal_entry_id, gl_account_id, entry_type, amount)
                VALUES (?, ?, '00000000-0000-0000-0001-000000010100', 'DEBIT', 100.00)
                """,
                postingId, journalId
        );

        assertThatThrownBy(() -> jdbcTemplate.update("UPDATE gl_ledger_postings SET amount = 999.00 WHERE id = ?", postingId))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("Immutable table: UPDATE not permitted on gl_ledger_postings");
    }

    @Test
    @Transactional
    @DisplayName("Should block DELETE on gl_ledger_postings via trg_gl_postings_no_delete trigger")
    void shouldBlockDeleteOnGlLedgerPostings() {
        String journalId = UuidUtils.generateV7().toString();
        String ref = "JRNL_PST_DEL_" + System.currentTimeMillis();
        jdbcTemplate.update(
                """
                INSERT INTO gl_journal_entries (id, journal_reference, transaction_type, posting_date, description, created_by_user_id)
                VALUES (?, ?, 'TRANSFER', CURDATE(), 'Test journal', '00000000-0000-0000-0000-000000000001')
                """,
                journalId, ref
        );

        String postingId = UuidUtils.generateV7().toString();
        jdbcTemplate.update(
                """
                INSERT INTO gl_ledger_postings (id, journal_entry_id, gl_account_id, entry_type, amount)
                VALUES (?, ?, '00000000-0000-0000-0001-000000010100', 'DEBIT', 100.00)
                """,
                postingId, journalId
        );

        assertThatThrownBy(() -> jdbcTemplate.update("DELETE FROM gl_ledger_postings WHERE id = ?", postingId))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("Immutable table: DELETE not permitted on gl_ledger_postings");
    }
}
