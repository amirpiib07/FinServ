-- ==============================================================================
-- FINServ Migration V1_6: Financial Transactions & Idempotency Schema
-- Tables: idempotency_records, transactions
-- Sourced strictly from docs/DATABASE_DESIGN.md (Section 3.6)
-- ==============================================================================

-- 1. Idempotency Records
CREATE TABLE idempotency_records (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    request_path VARCHAR(200) NOT NULL,
    http_status_code INT NULL,
    response_payload LONGTEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_idempotency PRIMARY KEY (id),
    CONSTRAINT uq_user_idempotency UNIQUE (user_id, idempotency_key),
    CONSTRAINT fk_idempotency_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_idempotency_status CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED'))
) ENGINE=InnoDB;

CREATE INDEX idx_idempotency_expires ON idempotency_records(expires_at);

-- 2. Transactions (UUIDv7)
CREATE TABLE transactions (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    transaction_reference VARCHAR(40) NOT NULL,
    from_account_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    to_account_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    transaction_type VARCHAR(40) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    from_account_balance_after DECIMAL(15, 2) NULL,
    to_account_balance_after DECIMAL(15, 2) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    failure_reason VARCHAR(255) NULL,
    reversal_of_transaction_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    channel VARCHAR(30) NOT NULL DEFAULT 'WEB',
    initiated_by_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    branch_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    idempotency_record_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    journal_entry_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6) NULL,
    CONSTRAINT pk_transactions PRIMARY KEY (id),
    CONSTRAINT uq_transactions_ref UNIQUE (transaction_reference),
    CONSTRAINT uq_transactions_reversal UNIQUE (reversal_of_transaction_id),
    CONSTRAINT uq_transactions_idempotency UNIQUE (idempotency_record_id),
    CONSTRAINT fk_transactions_from_acc FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_to_acc FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_reversal FOREIGN KEY (reversal_of_transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_initiator FOREIGN KEY (initiated_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_idempotency FOREIGN KEY (idempotency_record_id) REFERENCES idempotency_records(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_journal FOREIGN KEY (journal_entry_id) REFERENCES gl_journal_entries(id) ON DELETE RESTRICT,
    CONSTRAINT chk_transactions_type CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_INTERNAL', 'TRANSFER_EXTERNAL', 'FEE', 'INTEREST', 'REVERSAL')),
    CONSTRAINT chk_transactions_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
    CONSTRAINT chk_transactions_channel CHECK (channel IN ('WEB', 'MOBILE', 'BRANCH', 'ATM')),
    CONSTRAINT chk_transactions_amount CHECK (amount > 0.00),
    CONSTRAINT chk_transactions_fee CHECK (fee_amount >= 0.00),
    CONSTRAINT chk_transactions_distinct_accounts CHECK (from_account_id IS NULL OR to_account_id IS NULL OR from_account_id <> to_account_id),
    CONSTRAINT chk_transactions_account_presence CHECK (
        (transaction_type = 'DEPOSIT' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
        (transaction_type = 'WITHDRAWAL' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
        (transaction_type = 'TRANSFER_INTERNAL' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL) OR
        (transaction_type = 'TRANSFER_EXTERNAL' AND ((from_account_id IS NOT NULL AND to_account_id IS NULL) OR (from_account_id IS NULL AND to_account_id IS NOT NULL))) OR
        (transaction_type = 'FEE' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
        (transaction_type = 'INTEREST' AND from_account_id IS NULL AND to_account_id IS NOT NULL) OR
        (transaction_type = 'REVERSAL' AND (from_account_id IS NOT NULL OR to_account_id IS NOT NULL))
    )
) ENGINE=InnoDB;

CREATE INDEX idx_transactions_from_acc ON transactions(from_account_id, created_at);
CREATE INDEX idx_transactions_to_acc ON transactions(to_account_id, created_at);
CREATE INDEX idx_transactions_status ON transactions(status);
