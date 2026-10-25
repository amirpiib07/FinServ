USE finserv;

-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    account_status ENUM(
        'ACTIVE',
        'LOCKED',
        'DISABLED'
    ) NOT NULL DEFAULT 'ACTIVE',

    failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,

    last_login_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. ROLES
-- ============================================================

CREATE TABLE roles (
    role_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    role_name VARCHAR(50) NOT NULL UNIQUE,

    description VARCHAR(255),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. USER ROLES
-- Many-to-many relationship between users and roles
-- ============================================================

CREATE TABLE user_roles (
    user_id BIGINT UNSIGNED NOT NULL,

    role_id SMALLINT UNSIGNED NOT NULL,

    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 4. CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    customer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL UNIQUE,

    customer_number VARCHAR(20) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,

    middle_name VARCHAR(50) NULL,

    last_name VARCHAR(50) NOT NULL,

    date_of_birth DATE NOT NULL,

    gender ENUM(
        'MALE',
        'FEMALE',
        'OTHER',
        'PREFER_NOT_TO_SAY'
    ) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    mobile_number VARCHAR(15) NOT NULL UNIQUE,

    pan_number VARCHAR(10) NULL UNIQUE,

    customer_status ENUM(
        'ACTIVE',
        'INACTIVE',
        'BLOCKED',
        'SUSPENDED',
        'DECEASED'
    ) NOT NULL DEFAULT 'ACTIVE',

    profile_photo_url VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 5. CUSTOMER ADDRESSES
-- ============================================================

CREATE TABLE customer_addresses (
    address_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT UNSIGNED NOT NULL,

    address_type ENUM(
        'PERMANENT',
        'CURRENT',
        'COMMUNICATION'
    ) NOT NULL,

    address_line_1 VARCHAR(150) NOT NULL,

    address_line_2 VARCHAR(150) NULL,

    city VARCHAR(100) NOT NULL,

    state VARCHAR(100) NOT NULL,

    country VARCHAR(100) NOT NULL DEFAULT 'India',

    postal_code VARCHAR(10) NOT NULL,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_addresses_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
-- 6. BRANCHES
-- ============================================================

CREATE TABLE branches (
    branch_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    branch_code VARCHAR(20) NOT NULL UNIQUE,

    branch_name VARCHAR(100) NOT NULL,

    ifsc_code VARCHAR(11) NOT NULL UNIQUE,

    address_line_1 VARCHAR(150) NOT NULL,

    address_line_2 VARCHAR(150) NULL,

    city VARCHAR(100) NOT NULL,

    state VARCHAR(100) NOT NULL,

    postal_code VARCHAR(10) NOT NULL,

    contact_number VARCHAR(15) NULL,

    email VARCHAR(100) NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    opening_time TIME NULL,

    closing_time TIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. EMPLOYEES
-- ============================================================

CREATE TABLE employees (
    employee_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL UNIQUE,

    branch_id BIGINT UNSIGNED NOT NULL,

    employee_code VARCHAR(20) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,

    middle_name VARCHAR(50) NULL,

    last_name VARCHAR(50) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    mobile_number VARCHAR(15) NOT NULL UNIQUE,

    designation VARCHAR(100) NOT NULL,

    employment_status ENUM(
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
        'TERMINATED'
    ) NOT NULL DEFAULT 'ACTIVE',

    joining_date DATE NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_employees_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_employees_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 8. CUSTOMER KYC
-- ============================================================

CREATE TABLE kyc (
    kyc_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT UNSIGNED NOT NULL UNIQUE,

    kyc_status ENUM(
        'PENDING',
        'UNDER_REVIEW',
        'VERIFIED',
        'REJECTED',
        'EXPIRED'
    ) NOT NULL DEFAULT 'PENDING',

    verification_date DATETIME NULL,

    expiry_date DATE NULL,

    rejection_reason VARCHAR(500) NULL,

    verified_by_employee_id BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_kyc_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_kyc_verified_by
        FOREIGN KEY (verified_by_employee_id)
        REFERENCES employees(employee_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 9. KYC DOCUMENTS
-- ============================================================

CREATE TABLE kyc_documents (
    document_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    kyc_id BIGINT UNSIGNED NOT NULL,

    document_type ENUM(
        'PAN',
        'AADHAAR',
        'PASSPORT',
        'DRIVING_LICENSE',
        'VOTER_ID',
        'ADDRESS_PROOF',
        'OTHER'
    ) NOT NULL,

    document_number VARCHAR(100) NULL,

    document_file_url VARCHAR(500) NULL,

    document_status ENUM(
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'EXPIRED'
    ) NOT NULL DEFAULT 'PENDING',

    rejection_reason VARCHAR(500) NULL,

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    verified_at DATETIME NULL,

    verified_by_employee_id BIGINT UNSIGNED NULL,

    CONSTRAINT fk_kyc_documents_kyc
        FOREIGN KEY (kyc_id)
        REFERENCES kyc(kyc_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_kyc_documents_verified_by
        FOREIGN KEY (verified_by_employee_id)
        REFERENCES employees(employee_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 10. KYC VERIFICATION HISTORY
-- ============================================================

CREATE TABLE kyc_verification_history (
    kyc_history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    kyc_id BIGINT UNSIGNED NOT NULL,

    previous_status ENUM(
        'PENDING',
        'UNDER_REVIEW',
        'VERIFIED',
        'REJECTED',
        'EXPIRED'
    ) NULL,

    new_status ENUM(
        'PENDING',
        'UNDER_REVIEW',
        'VERIFIED',
        'REJECTED',
        'EXPIRED'
    ) NOT NULL,

    remarks VARCHAR(500) NULL,

    changed_by_employee_id BIGINT UNSIGNED NULL,

    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_kyc_history_kyc
        FOREIGN KEY (kyc_id)
        REFERENCES kyc(kyc_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_kyc_history_employee
        FOREIGN KEY (changed_by_employee_id)
        REFERENCES employees(employee_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 11. ACCOUNT TYPES
-- ============================================================

CREATE TABLE account_types (
    account_type_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    type_code VARCHAR(20) NOT NULL UNIQUE,

    type_name VARCHAR(50) NOT NULL UNIQUE,

    description VARCHAR(255) NULL,

    minimum_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. ACCOUNTS
-- ============================================================

CREATE TABLE accounts (
    account_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    account_number VARCHAR(20) NOT NULL UNIQUE,

    account_type_id SMALLINT UNSIGNED NOT NULL,

    branch_id BIGINT UNSIGNED NOT NULL,

    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    ledger_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    account_status ENUM(
        'PENDING',
        'ACTIVE',
        'FROZEN',
        'DORMANT',
        'CLOSED'
    ) NOT NULL DEFAULT 'PENDING',

    opening_date DATE NOT NULL,

    closing_date DATE NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounts_account_type
        FOREIGN KEY (account_type_id)
        REFERENCES account_types(account_type_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_accounts_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 13. ACCOUNT HOLDERS
-- ============================================================

CREATE TABLE account_holders (
    account_id BIGINT UNSIGNED NOT NULL,

    customer_id BIGINT UNSIGNED NOT NULL,

    holder_type ENUM(
        'PRIMARY',
        'JOINT'
    ) NOT NULL DEFAULT 'PRIMARY',

    ownership_percentage DECIMAL(5,2) NULL,

    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (account_id, customer_id),

    CONSTRAINT fk_account_holders_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_account_holders_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 14. ACCOUNT STATUS HISTORY
-- ============================================================

CREATE TABLE account_status_history (
    status_history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    account_id BIGINT UNSIGNED NOT NULL,

    previous_status ENUM(
        'PENDING',
        'ACTIVE',
        'FROZEN',
        'DORMANT',
        'CLOSED'
    ) NULL,

    new_status ENUM(
        'PENDING',
        'ACTIVE',
        'FROZEN',
        'DORMANT',
        'CLOSED'
    ) NOT NULL,

    reason VARCHAR(500) NULL,

    changed_by_employee_id BIGINT UNSIGNED NULL,

    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_account_status_history_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_account_status_history_employee
        FOREIGN KEY (changed_by_employee_id)
        REFERENCES employees(employee_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 15. ACCOUNT NOMINEES
-- ============================================================

CREATE TABLE account_nominees (
    nominee_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    account_id BIGINT UNSIGNED NOT NULL,

    nominee_name VARCHAR(100) NOT NULL,

    relationship VARCHAR(50) NOT NULL,

    date_of_birth DATE NULL,

    mobile_number VARCHAR(15) NULL,

    email VARCHAR(100) NULL,

    address VARCHAR(500) NULL,

    nominee_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_account_nominees_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE beneficiaries (
    beneficiary_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT UNSIGNED NOT NULL,

    beneficiary_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,

    nickname VARCHAR(50) NULL,

    beneficiary_type ENUM(
        'INTRA_BANK',
        'NEFT',
        'RTGS',
        'IMPS'
    ) NOT NULL DEFAULT 'NEFT',

    status ENUM(
        'PENDING',
        'ACTIVE',
        'INACTIVE',
        'BLOCKED'
    ) NOT NULL DEFAULT 'PENDING',

    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME NULL,
    deactivated_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_beneficiaries_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE beneficiary_status_history (
    status_history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    beneficiary_id BIGINT UNSIGNED NOT NULL,

    previous_status ENUM(
        'PENDING',
        'ACTIVE',
        'INACTIVE',
        'BLOCKED'
    ) NULL,

    new_status ENUM(
        'PENDING',
        'ACTIVE',
        'INACTIVE',
        'BLOCKED'
    ) NOT NULL,

    reason VARCHAR(500) NULL,

    changed_by_user_id BIGINT UNSIGNED NULL,

    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_beneficiary_status_history_beneficiary
        FOREIGN KEY (beneficiary_id)
        REFERENCES beneficiaries(beneficiary_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_beneficiary_status_history_user
        FOREIGN KEY (changed_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE transactions (
    transaction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    transaction_reference VARCHAR(50) NOT NULL UNIQUE,

    transaction_type ENUM(
        'TRANSFER',
        'DEPOSIT',
        'WITHDRAWAL',
        'UPI',
        'BILL_PAYMENT',
        'CARD_PAYMENT',
        'ATM',
        'FEE',
        'INTEREST',
        'REFUND',
        'REVERSAL'
    ) NOT NULL,

    channel ENUM(
        'WEB',
        'MOBILE',
        'ATM',
        'BRANCH',
        'UPI',
        'SYSTEM'
    ) NOT NULL,

    amount DECIMAL(15,2) NOT NULL,

    currency CHAR(3) NOT NULL DEFAULT 'INR',

    status ENUM(
        'PENDING',
        'PROCESSING',
        'SUCCESS',
        'FAILED',
        'REVERSED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    description VARCHAR(500) NULL,

    initiated_by_user_id BIGINT UNSIGNED NULL,

    parent_transaction_id BIGINT UNSIGNED NULL,

    initiated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    completed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (initiated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_transactions_parent
        FOREIGN KEY (parent_transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE transaction_entries (
    entry_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    transaction_id BIGINT UNSIGNED NOT NULL,

    account_id BIGINT UNSIGNED NOT NULL,

    entry_type ENUM(
        'DEBIT',
        'CREDIT'
    ) NOT NULL,

    amount DECIMAL(15,2) NOT NULL,

    balance_before DECIMAL(15,2) NOT NULL,

    balance_after DECIMAL(15,2) NOT NULL,

    entry_description VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_entries_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_transaction_entries_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE audit_logs (
    audit_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id BIGINT UNSIGNED NULL,

    old_values JSON NULL,

    new_values JSON NULL,

    description VARCHAR(500) NULL,

    ip_address VARCHAR(45) NULL,

    user_agent VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

