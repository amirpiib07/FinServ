-- ==============================================================================
-- FINServ Migration V4: Account Controls & Application Branch Schema
-- Sourced from Phase 4 requirements: customer-safe controls & branch selection
-- ==============================================================================

ALTER TABLE accounts 
    ADD COLUMN nickname VARCHAR(60) NULL;

ALTER TABLE account_applications 
    ADD COLUMN branch_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    ADD CONSTRAINT fk_account_app_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT;
