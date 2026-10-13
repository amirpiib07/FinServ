-- ==============================================================================
-- FINServ Migration V1_1: Identity & Access Control Schema
-- Tables: roles, users, user_roles, refresh_tokens, otp_challenges
-- Sourced strictly from docs/DATABASE_DESIGN.md (Section 3.1)
-- ==============================================================================

-- 1. System Roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name),
    CONSTRAINT chk_roles_name CHECK (name IN ('ROLE_CUSTOMER', 'ROLE_EMPLOYEE', 'ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE'))
) ENGINE=InnoDB;

-- 2. Core Users Table
CREATE TABLE users (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    email_verified_at DATETIME(6) NULL,
    phone_verified_at DATETIME(6) NULL,
    locked_until DATETIME(6) NULL,
    last_login_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone_number),
    CONSTRAINT chk_users_status CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'SUSPENDED')),
    CONSTRAINT chk_users_failed_attempts CHECK (failed_login_attempts >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_users_status ON users(status);

-- 3. User Roles (Many-to-Many Mapping)
CREATE TABLE user_roles (
    user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    role_id INT NOT NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. Rotating Refresh Tokens
CREATE TABLE refresh_tokens (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    token_family_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    replaced_by_token_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_refresh_tokens_replaced FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, revoked);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(token_family_id);

-- 5. Single-Use OTP Challenges
CREATE TABLE otp_challenges (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    purpose VARCHAR(30) NOT NULL DEFAULT 'REGISTRATION',
    contact_type VARCHAR(10) NOT NULL,
    target_destination VARCHAR(100) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at DATETIME(6) NOT NULL,
    verified_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_otp_challenges PRIMARY KEY (id),
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_otp_purpose CHECK (purpose IN ('REGISTRATION', 'LOGIN_2FA', 'PASSWORD_RESET', 'BENEFICIARY_ADDITION', 'HIGH_VALUE_TXN')),
    CONSTRAINT chk_otp_type CHECK (contact_type IN ('EMAIL', 'PHONE')),
    CONSTRAINT chk_otp_status CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED')),
    CONSTRAINT chk_otp_attempts CHECK (attempts >= 0 AND attempts <= max_attempts)
) ENGINE=InnoDB;

CREATE INDEX idx_otp_user ON otp_challenges(user_id, status);
