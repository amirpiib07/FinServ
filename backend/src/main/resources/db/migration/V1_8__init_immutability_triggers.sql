-- ==============================================================================
-- FINServ Migration V1_8: Engine-Level Immutability Triggers
-- Enforces absolute immutability on audit_logs, gl_journal_entries, gl_ledger_postings
-- Sourced strictly from docs/DATABASE_DESIGN.md (Section 3.8)
-- ==============================================================================

DELIMITER //

CREATE TRIGGER trg_audit_logs_no_update BEFORE UPDATE ON audit_logs
FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable table: UPDATE not permitted on audit_logs';
END //

CREATE TRIGGER trg_audit_logs_no_delete BEFORE DELETE ON audit_logs
FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable table: DELETE not permitted on audit_logs';
END //

CREATE TRIGGER trg_gl_journal_no_update BEFORE UPDATE ON gl_journal_entries
FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable table: UPDATE not permitted on gl_journal_entries';
END //

CREATE TRIGGER trg_gl_journal_no_delete BEFORE DELETE ON gl_journal_entries
FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable table: DELETE not permitted on gl_journal_entries';
END //

CREATE TRIGGER trg_gl_postings_no_update BEFORE UPDATE ON gl_ledger_postings
FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable table: UPDATE not permitted on gl_ledger_postings';
END //

CREATE TRIGGER trg_gl_postings_no_delete BEFORE DELETE ON gl_ledger_postings
FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Immutable table: DELETE not permitted on gl_ledger_postings';
END //

DELIMITER ;
