# FINServ — Master Feature Traceability Matrix

This matrix maps every functional requirement and roadmap capability to its phase, architectural code location, API endpoint, database dependencies, test coverage, and lifecycle status.

### Lifecycle Statuses:
- `NOT STARTED`
- `IN PROGRESS`
- `IMPLEMENTED`
- `TESTED`
- `BLOCKED`
- `DEFERRED WITH REASON`

---

| Feature ID | Phase | Feature Description | Target Code Location | API / DB Dependency | Verification & Test Suite | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0-ENV-01** | Phase 0 | Environment check & validation | CLI / Workspace | Java 26, Maven 3.10, Node 24, MySQL 8.0 | Version outputs & port 3306 ping | `TESTED` |
| **P0-GIT-02** | Phase 0 | Git repository initialization & `.gitignore` | `/.git`, `/.gitignore` | Git CLI | `git status`, branch check | `TESTED` |
| **P0-DOC-03** | Phase 0 | Master Requirements Specification | `docs/REQUIREMENTS.md` | None (Specification) | Document review | `IMPLEMENTED` |
| **P0-DOC-04** | Phase 0 | System Architecture Specification | `docs/ARCHITECTURE.md` | None (Specification) | Document review | `IMPLEMENTED` |
| **P0-DOC-05** | Phase 0 | Database Relational Design & ERD | `docs/DATABASE_DESIGN.md` | MySQL 8.0 schema (24 core tables across `V1_1`–`V1_8`, RESTRICT FKs, ISO 7064 Mod 11,10 account numbers, Canonical Audit Hash Chain, Maker-Checker CHECKs, Engine Triggers) | Throwaway scratch DB DDL & Trigger verification | `IMPLEMENTED` |
| **P0-DOC-06** | Phase 0 | Master Traceability Matrix | `docs/TRACEABILITY.md` | None (Specification) | Document review | `IMPLEMENTED` |
| **P0-DOC-07** | Phase 0 | Risks & External Dependencies Register | `docs/RISKS_AND_DEPENDENCIES.md` | None (Specification) | Document review | `IMPLEMENTED` |
| **P0-DOC-08** | Phase 0 | Progress Tracking & Execution Plan | `docs/PROGRESS.md` | None (Specification) | Document review | `IMPLEMENTED` |
| **P1-BE-01** | Phase 1 | Spring Boot 3.x project setup & build | `backend/pom.xml` | Spring Boot 3.3.4, JDK 21+ bytecode | `mvn clean package -DskipTests` | `TESTED` |
| **P1-BE-02** | Phase 1 | Flyway migration engine & 24 core tables schema | `backend/src/main/resources/db/migration` | Flyway, MySQL (`V1_1`–`V1_8`, `V2` seeds) | `FlywayMigrationAndSchemaIntegrationTest` | `TESTED` |
| **P1-BE-03** | Phase 1 | Core JPA Entities & Base Models (24 tables, RESTRICT FKs, Encrypted PII) | `com.finserv.common.model`, `com.finserv.modules.*.entity` | JPA / Hibernate validate, MySQL | `DatabaseConstraintsIntegrationTest`, `ImmutabilityTriggersIntegrationTest` | `TESTED` |
| **P1-BE-04** | Phase 1 | Centralized RFC 7807 Exception Handling | `com.finserv.common.exception` | Spring Web MVC | `GlobalExceptionHandlerTest` (3 tests) | `TESTED` |
| **P1-BE-05** | Phase 1 | Health Check, Actuator & OpenAPI/Swagger | `com.finserv.config.OpenApiConfig`, `SecurityConfig` | Spring Actuator, Springdoc | `SecurityBaselineIntegrationTest` | `TESTED` |
| **P1-BE-06** | Phase 1 | Strict UTC Timestamp Mapping Integration Test | `com.finserv.modules.database` | MySQL connectionTimeZone=UTC, Instant roundtrip | `UtcDateTimeMappingIntegrationTest` | `TESTED` |
| **P1-BE-07** | Phase 1 | Infrastructure services (Number sequences, Check digits, Encryption, Audit Hash Chain, Admin Bootstrap) | `com.finserv.modules.sequence`, `com.finserv.common.security`, `com.finserv.modules.audit` | SHA-256 chain, AES-256-GCM, ISO 7064 Mod 11,10, Luhn Mod 10, BCrypt | `AccountNumberGeneratorTest`, `CustomerNumberGeneratorTest`, `FieldEncryptionServiceTest`, `AuditServiceUnitTest`, `AuditChainIntegrityIntegrationTest`, `NumberSequenceConcurrencyIntegrationTest` | `TESTED` |
| **P2-FE-01** | Phase 2 | React + TypeScript + Vite foundation | `frontend/package.json` | Vite, Node.js 24 | `npm run build`, `npm run type-check`, `npm run lint` | `TESTED` |
| **P2-FE-02** | Phase 2 | Custom CSS Design System & Token Architecture | `frontend/src/styles/tokens.css` | Vanilla CSS tokens (raw & semantic) | Component tests, theme toggle, token isolation | `TESTED` |
| **P2-FE-03** | Phase 2 | Core UI Components (25 components with full states & jest-axe a11y) | `frontend/src/components/ui/` | Design system tokens, Radix UI headless primitives | Vitest component suite (80 tests), `/design-system` living catalog | `TESTED` |
| **P2-FE-04** | Phase 2 | Shared Banking Utilities (Decimal.js money math, Asia/Kolkata dates, masking, Zod schemas, idempotency UUID) | `frontend/src/lib/` | `decimal.js`, `zod` | Vitest unit tests (45 tests for money, dates, masking, validation, idempotency) | `TESTED` |
| **P2-FE-05** | Phase 2 | Typed API client with RFC 7807 error mapper & backend health probe | `frontend/src/lib/api-client.ts`, `frontend/src/hooks/useBackendHealth.ts` | Spring Actuator `/actuator/health`, RFC 7807 Problem Details | Vitest api-client tests & live `/actuator/health` probe | `TESTED` |
| **P3-BRAND-01** | Phase 3 | Brand asset ingestion (SVG logo & mark) & typography tokens | `frontend/src/components/common/BrandLogo.tsx`, `tokens.css` | Official SVG assets in `frontend/public/` | `BrandLogo.test.tsx` (3 tests) | `TESTED` |
| **P3-MOTION-02**| Phase 3 | Once-per-session logo intro animation & reduced-motion | `frontend/src/components/common/LogoIntro.tsx`, `src/hooks/useReducedMotion.ts` | CSS keyframes, `sessionStorage` | `BrandLogo.test.tsx` LogoIntro test suite (3 tests) | `TESTED` |
| **P3-AUTH-01**  | Phase 3 | User registration & BCrypt password hashing | `com.finserv.modules.identity.service.AuthService` | `POST /api/v1/auth/register`, `users`, `roles`, `audit_logs` | `AuthIntegrationTest.testRegisterCustomerSuccess` | `TESTED` |
| **P3-AUTH-02**  | Phase 3 | Stateless JWT login, dual-token issue & refresh rotation | `com.finserv.common.security.JwtService`, `AuthService` | `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `refresh_tokens` | `AuthIntegrationTest.testTokenRefreshRotationAndReplayDetection` | `TESTED` |
| **P3-AUTH-03**  | Phase 3 | Account lockout protection & revocation | `com.finserv.modules.identity.service.AuthService` | `POST /api/v1/auth/logout`, `users.failed_login_attempts` | `AuthIntegrationTest.testAccountLockoutAfter5FailedAttempts` | `TESTED` |
| **P3-AUTH-04**  | Phase 3 | Current authenticated user profile & roles | `com.finserv.modules.identity.controller.AuthController` | `GET /api/v1/auth/me` | `AuthIntegrationTest.testGetCurrentUserProfile` | `TESTED` |
| **P3-AUTH-05**  | Phase 3 | Demo contact OTP verification (simulation mode) | `com.finserv.modules.identity.service.OtpService` | `POST /api/v1/auth/verify-contact/send`, `POST /confirm`, `otp_challenges` | `AuthIntegrationTest.testOtpChallengeFlow` | `TESTED` |
| **P3-AUTH-06**  | Phase 3 | Frontend auth state, JWT interceptor, auto-refresh & route guards | `frontend/src/context/AuthProvider.tsx`, `src/lib/api-client.ts`, `src/routes/` | React Context, LocalStorage, React Router | `RouteGuards.test.tsx`, `api-client.test.ts` | `TESTED` |
| **P3-KYC-01**   | Phase 3 | Onboarding draft persistence & step progression | `com.finserv.modules.onboarding.service.OnboardingService` | `GET /api/v1/onboarding/application`, `PUT /step/{step}`, `onboarding_applications` | `OnboardingIntegrationTest.testStepProgressionAndSubmission` | `TESTED` |
| **P3-KYC-02**   | Phase 3 | Sensitive KYC encryption & blind-index PAN hash | `com.finserv.modules.onboarding.service.OnboardingService` | `FieldEncryptionService`, AES-256-GCM, HMAC-SHA256 | `OnboardingIntegrationTest.testDuplicatePanRejection` | `TESTED` |
| **P3-KYC-03**   | Phase 3 | Onboarding submission & verification-pending state | `com.finserv.modules.onboarding.service.OnboardingService` | `POST /api/v1/onboarding/application/submit`, `kyc_documents`, `customer_declarations`, `addresses` | `OnboardingIntegrationTest.testStepProgressionAndSubmission` | `TESTED` |
| **P3-KYC-04**   | Phase 3 | Frontend progressive onboarding stepper & verification tracker UI | `frontend/src/features/onboarding/` | `Stepper`, React Hook Form, Zod schemas | `OnboardingPage.test.tsx` (2 tests) | `TESTED` |
| **P4-ACC-01**   | Phase 4 | Account product applications & 14-digit ISO 7064 Mod 11,10 account opening | `com.finserv.modules.account` | `GET /api/v1/products/accounts`, `GET /api/v1/branches`, `POST /api/v1/accounts/applications`, `accounts`, `number_sequences` | `AccountIntegrationTest.testApplyAndAutoActivateAccount`, `AccountsPage.test.tsx` | `TESTED` |
| **P4-ACC-02**   | Phase 4 | Account ownership authorization, details & preferences control | `com.finserv.modules.account.service.AccountService` | `GET /api/v1/accounts`, `GET /api/v1/accounts/{id}`, `PATCH /api/v1/accounts/{id}/controls`, `audit_logs` | `AccountIntegrationTest.testAccountOwnershipAuthorization`, `AccountsPage.test.tsx` | `TESTED` |
| **P4-BEN-01**   | Phase 4 | Beneficiary management (intra/inter bank, IFSC validation, cooling-off, simulated OTP verify & delete) | `com.finserv.modules.beneficiary` | `GET /api/v1/beneficiaries`, `POST /api/v1/beneficiaries`, `POST /verify`, `DELETE /{id}`, `beneficiaries` | `BeneficiaryIntegrationTest` (6 tests), `BeneficiariesPage.test.tsx` (4 tests) | `TESTED` |
| **P5-LEDGER-01**| Phase 5 | Double-entry general ledger engine (Balanced debits/credits) | `com.finserv.modules.ledger` | `gl_journal_entries`, `gl_ledger_postings` | Balanced debits/credits test | `NOT STARTED` |
| **P5-TXN-02**   | Phase 5 | Pessimistic row locking, transfers, deposits & withdrawals | `com.finserv.modules.transaction` | `PESSIMISTIC_WRITE`, `accounts`, `transactions` | Concurrent transfer test | `NOT STARTED` |
| **P5-IDEMP-03** | Phase 5 | Strict idempotency filter `UNIQUE(user_id, key)` | `com.finserv.common.idempotency` | `X-Idempotency-Key`, `idempotency_records` | Replay response test | `NOT STARTED` |
| **P5-STMT-04**  | Phase 5 | Paginated transaction history, digital receipts & statements | `com.finserv.modules.statement` | `GET /api/v1/transactions`, digital receipts | Receipt hash & statement test | `NOT STARTED` |
| **P6-DASH-01**  | Phase 6 | Customer 360 dashboard UI & navigation | `frontend/src/features/dashboard/` | `/api/v1/accounts`, `/api/v1/transactions` | Dashboard render test | `NOT STARTED` |
| **P6-PORT-02**  | Phase 6 | Employee portal & maker-checker approvals (KYC & accounts) | `frontend/src/features/employee/`, `com.finserv.modules.approval` | `/api/v1/employee/*`, `onboarding_applications`, `customers` | Maker-checker approval test | `NOT STARTED` |
| **P6-AUDIT-03** | Phase 6 | Admin portal & cryptographic audit console | `frontend/src/features/admin/`, `com.finserv.modules.audit` | `/api/v1/audit-logs`, `audit_logs` | Audit tamper-check test | `NOT STARTED` |
| **P7-ADDON-01** | Phase 7 | Core banking add-ons (Term Deposits & Cards preview) | `com.finserv.modules.deposit`, `frontend/src/features/cards` | `term_deposits`, `cards` | Add-on feature test | `NOT STARTED` |
| **P7-QA-02**    | Phase 7 | Full-stack E2E regression, a11y polish & final documentation | System-wide | Backend + DB + Frontend | Playwright E2E, Axe a11y, runbooks | `NOT STARTED` |
