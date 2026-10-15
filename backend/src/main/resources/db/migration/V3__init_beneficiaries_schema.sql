-- ==============================================================================
-- FINServ Migration V3: Beneficiaries Schema & Additional Reference Branches
-- Table: beneficiaries
-- Sourced strictly from docs/DATABASE_DESIGN.md (Section 3.10)
-- ==============================================================================

CREATE TABLE beneficiaries (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    customer_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    payee_type VARCHAR(20) NOT NULL,
    nickname VARCHAR(60) NOT NULL,
    beneficiary_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(34) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    daily_transfer_limit DECIMAL(15, 2) NULL,
    cooling_off_until DATETIME(6) NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_beneficiaries PRIMARY KEY (id),
    CONSTRAINT uq_beneficiaries_payee UNIQUE (customer_id, account_number, ifsc_code),
    CONSTRAINT fk_beneficiaries_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_beneficiaries_type CHECK (payee_type IN ('INTRA_BANK', 'INTER_BANK', 'UPI')),
    CONSTRAINT chk_beneficiaries_vstatus CHECK (verification_status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
    CONSTRAINT chk_beneficiaries_limit CHECK (daily_transfer_limit IS NULL OR daily_transfer_limit >= 0.00)
) ENGINE=InnoDB;

CREATE INDEX idx_beneficiaries_cust ON beneficiaries(customer_id, is_active);

-- Additional reference branches for multi-branch selection
INSERT INTO branches (
    id, branch_code, branch_name, ifsc_code, routing_number, street_address,
    city, state, postal_code, phone_number, manager_user_id, status, created_at
) VALUES 
(
    '00000000-0000-0000-0003-000000001002',
    '1002',
    'Bangalore Tech Hub Branch',
    'FINS0001002',
    '0001002',
    '45 Outer Ring Road, Bellandur',
    'Bangalore',
    'Karnataka',
    '560103',
    '+918000001002',
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP(6)
),
(
    '00000000-0000-0000-0003-000000001003',
    '1003',
    'Delhi Central Branch',
    'FINS0001003',
    '0001003',
    '12 Barakhamba Road, Connaught Place',
    'New Delhi',
    'Delhi',
    '110001',
    '+911100001003',
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP(6)
)
ON DUPLICATE KEY UPDATE branch_name = VALUES(branch_name);
