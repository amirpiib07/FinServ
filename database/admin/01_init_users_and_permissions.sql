-- ==============================================================================
-- FINServ: Database, Users, and Permissions Initialization Script
-- Sourced from docs/DATABASE_DESIGN.md (Section 3.9)
-- 
-- INSTRUCTIONS:
-- 1. Replace the password placeholders '${FINSERV_MIGRATION_PASSWORD}' and
--    '${FINSERV_APP_PASSWORD}' with strong, secure local passwords.
-- 2. Execute this script using a privileged MySQL account (e.g. root):
--      mysql -u root -p < database/admin/01_init_users_and_permissions.sql
-- 3. Update backend/.env with the exact matching passwords:
--      DB_MIGRATION_PASSWORD=your_migration_password
--      DB_PASSWORD=your_app_password
-- ==============================================================================

-- 1. Create Core Database (UTF-8 MB4, Unicode Collation)
CREATE DATABASE IF NOT EXISTS finserv_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Create Scratch / Test Database for Automated Testing
CREATE DATABASE IF NOT EXISTS finserv_test_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 3. Migration User (DDL, DML, Triggers, References)
CREATE USER IF NOT EXISTS 'finserv_migration'@'localhost' IDENTIFIED BY '${FINSERV_MIGRATION_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES, TRIGGER ON finserv_db.* TO 'finserv_migration'@'localhost';
GRANT ALL PRIVILEGES ON finserv_test_db.* TO 'finserv_migration'@'localhost';

-- 4. Application Runtime User (DML + Explicit Restricted Deletes)
CREATE USER IF NOT EXISTS 'finserv_app'@'localhost' IDENTIFIED BY '${FINSERV_APP_PASSWORD}';
GRANT SELECT, INSERT, UPDATE ON finserv_db.* TO 'finserv_app'@'localhost';
GRANT DELETE ON finserv_db.idempotency_records TO 'finserv_app'@'localhost';
GRANT DELETE ON finserv_db.otp_challenges TO 'finserv_app'@'localhost';
GRANT ALL PRIVILEGES ON finserv_test_db.* TO 'finserv_app'@'localhost';

-- 5. Binary Logging Function / Trigger Creator Privilege (if binary logging is active)
-- Note: In MySQL with binary logging (log_bin = ON), creating triggers may require:
-- SET GLOBAL log_bin_trust_function_creators = 1;

FLUSH PRIVILEGES;
