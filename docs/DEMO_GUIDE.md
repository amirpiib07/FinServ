# FinServ Local Demo Guide

This guide covers a safe local walkthrough of FinServ. It does not provision customer data, account balances, or simulated transaction results.

## Prepare an isolated local environment

1. Follow the setup instructions in the [project README](../README.md).
2. Configure `backend/.env` with a local MySQL database, a 32-byte `APP_ENCRYPTION_KEY`, a sufficiently long `JWT_SECRET`, and separate passwords for the optional local demo identities.
3. Keep the encryption key stable for any database containing encrypted customer fields. Changing it without a data migration plan can make those fields unreadable.
   If existing local data was encrypted while the earlier development fallback was active, configure that same prior key before starting the updated backend.
4. Use the `dev` and `demo` Spring profiles only with an isolated local database. Do not point them at shared or production data.
5. Start the backend and frontend using the commands in the README.

## Optional staff demo identities

With both `dev` and `demo` active, the backend creates missing staff demo identities and synchronizes the passwords and roles for the exact demo usernames below using the `DEMO_SUPER_ADMIN_PASSWORD` and `DEMO_OFFICER_PASSWORD` values on each startup. This also clears login-attempt lockouts for those two demo users. The login page's development-only shortcuts fill in usernames; enter the configured passwords yourself.

| Role | Username | Landing page |
| --- | --- | --- |
| Bank Officer / Admin | `officer.mumbai` | `/admin/dashboard` |
| Super Admin | `amit.kumar.singh` | `/admin/dashboard` |

The runner does not change other existing users, create a customer profile, or create a bank account or balance. Customer journeys must begin through the normal registration and onboarding screens. Existing customer data is left in place. Use `dev,demo` only with an isolated local database because these two demo staff passwords are synchronized from the local environment on each startup.

## Walkthrough

1. Sign in with a locally provisioned staff identity or register a customer through `/register`.
2. Follow the UI's onboarding instructions. The application should show completion only after the backend confirms the relevant operation.
3. For staff review, use the admin pages available to the signed-in role. Use only data created in the isolated local database.
4. For customer pages, use the accounts, statements, and transaction screens after completing the actual onboarding and account-opening flow. Empty states are expected when no matching persisted data exists.
5. Review errors and operation statuses in the UI; do not infer success from a click or animation alone.

## Safety and verification notes

- No database reset or destructive migration is part of this guide.
- Do not use real credentials, production customer data, or real banking integrations for evaluation.
- No balances or transactions are preloaded by the demo runner.
- A successful transaction or account operation must be confirmed by the backend response and persisted local data.
- Backend/database integration testing requires a confirmed isolated test database; see the README before running it.
