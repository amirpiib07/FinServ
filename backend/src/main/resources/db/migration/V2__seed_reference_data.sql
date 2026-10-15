-- ==============================================================================
-- FINServ Migration V2: Idempotent Reference Seed Data
-- Sourced strictly from docs/DATABASE_DESIGN.md (Section 5.3)
-- Invariants: NO sample customers, accounts, balances, and NO admin password.
-- ==============================================================================

-- 1. System Authorization Roles
INSERT INTO roles (id, name, description, created_at) VALUES
    (1, 'ROLE_CUSTOMER', 'Retail banking customer with access to owned accounts', CURRENT_TIMESTAMP(6)),
    (2, 'ROLE_EMPLOYEE', 'Branch employee / teller handling customer counter services', CURRENT_TIMESTAMP(6)),
    (3, 'ROLE_MANAGER', 'Branch or operational manager with approval and override authority', CURRENT_TIMESTAMP(6)),
    (4, 'ROLE_ADMIN', 'System administrator with operational configuration privileges', CURRENT_TIMESTAMP(6)),
    (5, 'ROLE_COMPLIANCE', 'Compliance and audit officer with AML and SAR filing oversight', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Non-Login System Daemon User (Used as actor for automated system events)
INSERT INTO users (
    id, username, email, phone_number, password_hash, status, is_system,
    failed_login_attempts, email_verified_at, phone_verified_at, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SYSTEM_INTERNAL',
    'system@internal.finserv.local',
    '+910000000000',
    '*LOCKED*',
    'ACTIVE',
    TRUE,
    0,
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6)
)
ON DUPLICATE KEY UPDATE status = 'ACTIVE', is_system = TRUE;

-- 3. Standard General Ledger Chart of Accounts (10 Core Accounts)
INSERT INTO gl_chart_of_accounts (id, gl_code, account_name, account_type, balance_side, description, is_active, created_at) VALUES
    ('00000000-0000-0000-0001-000000010100', '10100', 'Vault Cash', 'ASSET', 'DEBIT', 'Physical currency in branch vaults and tellers', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000010200', '10200', 'Central Bank Reserve / Clearing', 'ASSET', 'DEBIT', 'Reserve balance held with central clearing institution', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000010300', '10300', 'Inter-Bank Settlement Transit', 'ASSET', 'DEBIT', 'Clearing suspense account for outward/inward settlements', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000020100', '20100', 'Customer Savings Deposits', 'LIABILITY', 'CREDIT', 'Total customer liability for savings accounts', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000020200', '20200', 'Customer Current/Checking Deposits', 'LIABILITY', 'CREDIT', 'Total customer liability for current/checking accounts', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000020300', '20300', 'Term / Fixed Deposit Deposits', 'LIABILITY', 'CREDIT', 'Total liability for customer fixed and recurring deposits', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000030100', '30100', 'Bank Equity Capital', 'EQUITY', 'CREDIT', 'Initial capital and retained bank earnings', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000040100', '40100', 'Fee & Commission Income', 'REVENUE', 'CREDIT', 'Processing charges, maintenance, and wire transfer fees', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000040200', '40200', 'Loan Interest Earned', 'REVENUE', 'CREDIT', 'Invoiced and collected customer loan interest', TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0001-000000050100', '50100', 'Deposit Interest Expense', 'EXPENSE', 'DEBIT', 'Interest paid out on customer savings and term deposits', TRUE, CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE account_name = VALUES(account_name);

-- 4. Standard Banking Account Products (Bound to GL Liabilities)
INSERT INTO account_products (
    id, product_code, product_name, product_type, gl_account_id, currency,
    min_balance, interest_rate_percentage, overdraft_allowed, overdraft_limit, is_active, created_at
) VALUES
    ('00000000-0000-0000-0002-000000000001', '01', 'Regular Savings Account', 'SAVINGS', '00000000-0000-0000-0001-000000020100', 'INR', 1000.00, 3.50, FALSE, 0.00, TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0002-000000000002', '02', 'Current Business Account', 'CURRENT', '00000000-0000-0000-0001-000000020200', 'INR', 5000.00, 0.00, FALSE, 0.00, TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0002-000000000003', '03', 'Corporate Salary Account', 'SALARY', '00000000-0000-0000-0001-000000020100', 'INR', 0.00, 3.50, FALSE, 0.00, TRUE, CURRENT_TIMESTAMP(6)),
    ('00000000-0000-0000-0002-000000000004', '04', 'Student Savings Account', 'STUDENT', '00000000-0000-0000-0001-000000020100', 'INR', 0.00, 3.00, FALSE, 0.00, TRUE, CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE product_name = VALUES(product_name);

-- 5. Head Office Branch (Code: 1001)
INSERT INTO branches (
    id, branch_code, branch_name, ifsc_code, routing_number, street_address,
    city, state, postal_code, phone_number, manager_user_id, status, created_at
) VALUES (
    '00000000-0000-0000-0003-000000001001',
    '1001',
    'Head Office - Mumbai Main Branch',
    'FINS0001001',
    '0001001',
    '100 Financial Boulevard, Nariman Point',
    'Mumbai',
    'Maharashtra',
    '400021',
    '+912200001001',
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP(6)
)
ON DUPLICATE KEY UPDATE branch_name = VALUES(branch_name);

-- 6. Atomic Number Sequence Baseline Rows
INSERT INTO number_sequences (name, current_value, updated_at) VALUES
    ('account_num_seq', 0, CURRENT_TIMESTAMP(6)),
    ('customer_cif_seq_2026', 0, CURRENT_TIMESTAMP(6)),
    ('audit_chain_seq', 0, CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP(6);
