-- ==============================================================================
-- FINServ Migration V5: Super Admin Authorization & Administration Support
-- Schema: Update roles check constraint and insert ROLE_SUPER_ADMIN
-- ==============================================================================

ALTER TABLE roles DROP CHECK chk_roles_name;

ALTER TABLE roles ADD CONSTRAINT chk_roles_name CHECK (
    name IN ('ROLE_CUSTOMER', 'ROLE_EMPLOYEE', 'ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE', 'ROLE_SUPER_ADMIN')
);

INSERT INTO roles (id, name, description, created_at) VALUES
    (6, 'ROLE_SUPER_ADMIN', 'Super Administrator with full bank executive and audit privileges', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE description = VALUES(description);
