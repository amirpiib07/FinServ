-- ==============================================================================
-- FINServ Migration V1_4: Products, Accounts & Applications Schema
-- Tables: gl_chart_of_accounts, account_products, accounts, account_applications, account_holds
-- Sourced strictly from docs/DATABASE_DESIGN.md (Section 3.4)
-- Note: accounts is created BEFORE account_applications due to foreign key dependency
-- ==============================================================================

-- 1. GL Chart of Accounts
CREATE TABLE gl_chart_of_accounts (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    gl_code VARCHAR(30) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance_side VARCHAR(10) NOT NULL,
    description VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_gl_chart PRIMARY KEY (id),
    CONSTRAINT uq_gl_code UNIQUE (gl_code),
    CONSTRAINT chk_gl_type CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    CONSTRAINT chk_gl_side CHECK (balance_side IN ('DEBIT', 'CREDIT'))
) ENGINE=InnoDB;

-- 2. Account Products
CREATE TABLE account_products (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    product_code VARCHAR(2) NOT NULL,
    product_name VARCHAR(80) NOT NULL,
    product_type VARCHAR(30) NOT NULL,
    gl_account_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    min_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    interest_rate_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    overdraft_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    overdraft_limit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_account_products PRIMARY KEY (id),
    CONSTRAINT uq_products_code UNIQUE (product_code),
    CONSTRAINT fk_products_gl FOREIGN KEY (gl_account_id) REFERENCES gl_chart_of_accounts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_products_code_format CHECK (product_code REGEXP '^[0-9]{2}$'),
    CONSTRAINT chk_products_type CHECK (product_type IN ('SAVINGS', 'CURRENT', 'SALARY', 'STUDENT')),
    CONSTRAINT chk_products_min_balance CHECK (min_balance >= 0.00),
    CONSTRAINT chk_products_interest CHECK (interest_rate_percentage >= 0.00),
    CONSTRAINT chk_products_overdraft CHECK (overdraft_limit >= 0.00)
) ENGINE=InnoDB;

-- 3. Core Customer Accounts (Created BEFORE account_applications)
CREATE TABLE accounts (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    customer_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    branch_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    account_number VARCHAR(14) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    available_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    hold_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    opened_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    closed_at DATETIME(6) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_accounts PRIMARY KEY (id),
    CONSTRAINT uq_accounts_number UNIQUE (account_number),
    CONSTRAINT fk_accounts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_accounts_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_accounts_product FOREIGN KEY (product_id) REFERENCES account_products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_accounts_number_format CHECK (account_number REGEXP '^[0-9]{14}$'),
    CONSTRAINT chk_accounts_status CHECK (status IN ('ACTIVE', 'DORMANT', 'FROZEN', 'CLOSED')),
    CONSTRAINT chk_accounts_current_nonneg CHECK (current_balance >= 0.00),
    CONSTRAINT chk_accounts_holds CHECK (hold_balance >= 0.00),
    CONSTRAINT chk_accounts_avail_calc CHECK (available_balance = current_balance - hold_balance),
    CONSTRAINT chk_accounts_avail_nonneg CHECK (available_balance >= 0.00)
) ENGINE=InnoDB;

CREATE INDEX idx_accounts_customer ON accounts(customer_id);
CREATE INDEX idx_accounts_status ON accounts(status);

-- 4. Account Applications
CREATE TABLE account_applications (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    customer_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    application_number VARCHAR(30) NOT NULL,
    initial_deposit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    application_status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    reviewed_by_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    reviewed_at DATETIME(6) NULL,
    rejection_reason VARCHAR(255) NULL,
    created_account_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_account_applications PRIMARY KEY (id),
    CONSTRAINT uq_account_app_num UNIQUE (application_number),
    CONSTRAINT fk_account_app_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_app_product FOREIGN KEY (product_id) REFERENCES account_products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_app_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_app_account FOREIGN KEY (created_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_account_app_status CHECK (application_status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_account_app_deposit CHECK (initial_deposit_amount >= 0.00)
) ENGINE=InnoDB;

-- 5. Account Holds
CREATE TABLE account_holds (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    account_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    hold_reference VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reason VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_account_holds PRIMARY KEY (id),
    CONSTRAINT uq_account_holds_ref UNIQUE (hold_reference),
    CONSTRAINT fk_account_holds_acc FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_account_holds_status CHECK (status IN ('ACTIVE', 'RELEASED', 'EXECUTED')),
    CONSTRAINT chk_account_holds_amount CHECK (amount > 0.00)
) ENGINE=InnoDB;

CREATE INDEX idx_account_holds_acc ON account_holds(account_id, status);
