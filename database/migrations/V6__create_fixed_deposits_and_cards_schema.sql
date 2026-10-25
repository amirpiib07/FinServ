-- ==============================================================================
-- FINServ Migration V6: Fixed Deposits & Virtual Cards Schema
-- Tables: fixed_deposits, virtual_cards
-- ==============================================================================

-- 1. Fixed Deposits Table
CREATE TABLE fixed_deposits (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    deposit_number VARCHAR(24) NOT NULL,
    customer_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    source_account_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL,
    interest_rate_percentage DECIMAL(5, 2) NOT NULL,
    tenure_months INT NOT NULL,
    maturity_amount DECIMAL(15, 2) NOT NULL,
    interest_earned DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    start_date DATETIME(6) NOT NULL,
    maturity_date DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_fixed_deposits PRIMARY KEY (id),
    CONSTRAINT uq_fixed_deposits_number UNIQUE (deposit_number),
    CONSTRAINT fk_fixed_deposits_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fixed_deposits_account FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_fd_principal CHECK (principal_amount >= 1000.00),
    CONSTRAINT chk_fd_interest_rate CHECK (interest_rate_percentage >= 0.00),
    CONSTRAINT chk_fd_tenure CHECK (tenure_months >= 1),
    CONSTRAINT chk_fd_status CHECK (status IN ('ACTIVE', 'MATURED', 'CLOSED'))
) ENGINE=InnoDB;

CREATE INDEX idx_fixed_deposits_cust ON fixed_deposits(customer_id, status);

-- 2. Virtual Cards Table
CREATE TABLE virtual_cards (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    account_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    customer_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    card_number_masked VARCHAR(24) NOT NULL,
    card_number_last4 VARCHAR(4) NOT NULL,
    card_network VARCHAR(20) NOT NULL DEFAULT 'VISA',
    card_type VARCHAR(30) NOT NULL DEFAULT 'PLATINUM_VIRTUAL_DEBIT',
    cardholder_name VARCHAR(100) NOT NULL,
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    online_transactions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    contactless_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    international_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    daily_spend_limit DECIMAL(15, 2) NOT NULL DEFAULT 50000.00,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_virtual_cards PRIMARY KEY (id),
    CONSTRAINT uq_virtual_cards_account UNIQUE (account_id),
    CONSTRAINT fk_virtual_cards_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_virtual_cards_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_vc_status CHECK (status IN ('ACTIVE', 'FROZEN', 'BLOCKED', 'EXPIRED')),
    CONSTRAINT chk_vc_month CHECK (expiry_month BETWEEN 1 AND 12),
    CONSTRAINT chk_vc_daily_limit CHECK (daily_spend_limit >= 0.00)
) ENGINE=InnoDB;

CREATE INDEX idx_virtual_cards_cust ON virtual_cards(customer_id, status);
