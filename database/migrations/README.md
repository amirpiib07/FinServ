# Database Migrations

The ordered Flyway scripts in this directory are mirrored to
`backend/src/main/resources/db/migration/`, the runtime migration location.
Keep both copies in sync when adding or updating a migration. The current
sequence includes schema migrations V1_1 through V1_8 and V3 through V6, plus
the V2 reference-data seed.
