-- ==============================================================================
-- FINServ Migration V1_7: Dual-Authorization, Sequence Counters & Audit Logs Schema
-- Tables: approval_requests, number_sequences, audit_logs
-- Sourced strictly from docs/DATABASE_DESIGN.md (Section 3.7)
-- ==============================================================================

-- 1. Dual-Authorization Queue (Maker-Checker)
CREATE TABLE approval_requests (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    maker_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    checker_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action_type VARCHAR(40) NOT NULL,
    payload_json JSON NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(255) NULL,
    decided_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_approval_requests PRIMARY KEY (id),
    CONSTRAINT fk_approvals_maker FOREIGN KEY (maker_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_approvals_checker FOREIGN KEY (checker_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_approvals_maker_checker CHECK (checker_user_id IS NULL OR maker_user_id <> checker_user_id),
    CONSTRAINT chk_approvals_decision CHECK (
        (status NOT IN ('APPROVED', 'REJECTED')) OR 
        (checker_user_id IS NOT NULL AND decided_at IS NOT NULL)
    ),
    CONSTRAINT chk_approvals_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
) ENGINE=InnoDB;

CREATE INDEX idx_approvals_status ON approval_requests(status);
CREATE INDEX idx_approvals_entity ON approval_requests(entity_type, entity_id);

-- 2. Atomic Row-Locked Sequence Counters
CREATE TABLE number_sequences (
    name VARCHAR(50) NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_number_sequences PRIMARY KEY (name)
) ENGINE=InnoDB;

-- 3. Tamper-Evident Cryptographic Audit Chain (UUIDv7)
CREATE TABLE audit_logs (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    chain_seq BIGINT NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    actor_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    actor_role VARCHAR(50) NULL,
    action VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    correlation_id VARCHAR(64) NULL,
    old_value_json JSON NULL,
    new_value_json JSON NULL,
    payload_canonical LONGTEXT NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT uq_audit_chain_seq UNIQUE (chain_seq),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_audit_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'OVERRIDE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'APPROVE', 'REJECT'))
) ENGINE=InnoDB;

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, created_at);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
