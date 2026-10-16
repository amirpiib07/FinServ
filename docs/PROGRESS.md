# FINServ — Engineering Progress & Roadmap Log

## 1. Project Overview & Current State

- **Current Milestone**: Phase 4 — Accounts (Applications, Opening, Details) & Beneficiary Management
- **Phase Status**: `COMPLETED`
- **Active Git Branch**: `phase-4-accounts-beneficiaries`
- **Current Target**: Awaiting approval to proceed to Phase 5 (Money Transfers, Deposits/Withdrawals, Double-Entry Ledger)

---

## 2. Milestone Execution Status (Consolidated 7-Phase Master Roadmap)

| Phase | Milestone Name | Status | Branch | Notes / Completion Evidence |
| :---: | :--- | :--- :---: | :--- | :--- |
| **0** | **Architecture & Database Design** | **COMPLETED** | `phase-0-requirements-architecture-db` | All specifications, ERD, and traceability delivered in `docs/`. |
| **1** | **Backend Foundation & MySQL Flyway Setup** | **COMPLETED** | `phase-1-backend-foundation` | 24 core tables + triggers (`V1_1`–`V1_8`, `V2`), Flyway, JPA, UUIDv7, Audit Hash Chain, AES-256-GCM, ISO 7064/Luhn generators, 52 automated tests passing, Actuator `/actuator/health` UP, Swagger UI verified. |
| **2** | **Frontend Foundation & UI Component Kit** | **COMPLETED** | `phase-2-frontend-foundation` | React 19 + TypeScript (strict, `noUncheckedIndexedAccess`), Vite proxy, Tier 1/2 Vanilla CSS tokens, 25 UI components with all states, Radix UI headless primitives, Decimal.js money math (`ROUND_HALF_EVEN`), Asia/Kolkata dates, masking, Zod schemas, RFC 7807 error mapper, Actuator health probe, dev-only `/design-system` catalog (tree-shaken from prod), 80 Vitest unit/a11y tests passing, 0 lint/typecheck errors. Merged to `main`. |
| **3** | **Branding, Auth (JWT/Sessions) & Progressive Customer Onboarding + KYC** | **COMPLETED** | `phase-3-auth-kyc-branding` | Official SVG brand mark ingestion, CSS tokens polish, stateless JWT dual-token auth with rotation and replay attack mitigation, 15-minute lock on 5 failed attempts, demo OTP contact verification, 5-step progressive customer onboarding/KYC wizard with encrypted drafts & blind-index PAN hash, verification pending tracker, route guards (unverified customer redirection). 61 backend tests + 94 frontend tests passing. Merged to `main`. |
| **4** | **Accounts (Applications, Opening, Details) & Beneficiary Management** | **COMPLETED** | `phase-4-accounts-beneficiaries` | Account products, branches, collision-free ISO 7064 Mod 11,10 account opening with pessimistic sequence lock, customer account dashboard cards, ownership guards, beneficiaries with IFSC validation, cooling-off/verification simulation. 70 backend tests + 101 frontend tests passing. |
| **5** | **Money Transfers, Deposits/Withdrawals, Double-Entry Ledger & Statements/Receipts** | `NOT STARTED` | - | Balanced double-entry general ledger (`gl_journal_entries`, `gl_ledger_postings`), pessimistic row locks, strict idempotency filter, cash deposit/withdrawal, funds transfer, statements & cryptographic receipts. |
| **6** | **Customer Dashboard + Employee/Admin Portal (KYC/Account Approvals & Audit Logs)** | `NOT STARTED` | - | Customer 360 dashboard & navigation, branch employee teller desk, manager maker-checker approvals (onboarding KYC approval & account opening), audit console. |
| **7** | **Core Add-ons (FD/Cards Overview), UI/Motion Polish, End-to-End QA & Final Docs** | `NOT STARTED` | - | Term deposits overview, virtual debit cards preview, accessible motion polish, full-stack E2E regression, final documentation & runbooks. |

---

## 3. Key Architecture & Engineering Decisions (Phase 0)

1. **Monetary Precision Principle**:
   - Zero floating point (`float` or `double`).
   - Database: `DECIMAL(15,2)` for customer balances; `DECIMAL(19,4)` for intermediate interest rates.
   - Backend: `java.math.BigDecimal` with `RoundingMode.HALF_EVEN` (Banker's Rounding).

2. **Accounting Invariant Principle (Double-Entry General Ledger)**:
   - Balances are never modified arbitrarily.
   - Every transaction creates balanced `gl_journal_entries` and `gl_ledger_postings` ($\sum \text{Debits} == \sum \text{Credits}$).
   - Customer balances mirror liability ledger entries.

3. **Concurrency & Race Condition Prevention**:
   - Explicit row-level locking (`SELECT ... FOR UPDATE` via `PESSIMISTIC_WRITE`) inside `@Transactional(isolation = Isolation.READ_COMMITTED)`.
   - Participating accounts are always acquired in deterministic ascending primary key order to eliminate deadlocks.

4. **Strict Idempotency Policy**:
   - All state-altering endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require `X-Idempotency-Key`.
   - Handled by a dedicated interceptor writing to `idempotency_records` with SHA-256 payload hash and a 24-hour response replay cache.

5. **Security & Zero Secrets in Source Control**:
   - Database credentials and secrets loaded strictly from `backend/.env`.
   - Template provided in `backend/.env.example` with non-sensitive placeholder credentials.
   - Git repository `.gitignore` strictly protects all `.env` files.

---

## 4. Environment Verification Log

| Tool / Runtime | Verified Version | Status |
| :--- | :--- | :--- |
| **Java JDK** | `26.0.1+8-34` (Java SE Runtime 64-bit) | `COMPATIBLE` (Supports Spring Boot 3 / Java 21+ bytecode) |
| **Maven** | `Apache Maven 3.10.0` | `COMPATIBLE` |
| **Node.js** | `v24.20.0` | `COMPATIBLE` |
| **npm** | `11.19.0` | `COMPATIBLE` |
| **Git** | `2.54.0.windows.1` | `INITIALIZED` |
| **MySQL Server** | `8.0.46 Community Server` (`MySQL80` service Running) | `PORT 3306 REACHABLE` |
| **Credentials File**| `backend/.env.example` template created | `Awaiting local password in backend/.env` |

---

---

## 5. How to Run & Verify Phase 1

1. **Verify Git Branch & Status**:
   ```bash
   git branch
   git status
   ```
   *Expected output*: On branch `phase-1-backend-foundation`.

2. **Execute Automated Test Suite (Isolated Scratch Test Database)**:
   ```bash
   cd backend
   mvn test
   ```
   *Verification Result*: 52 tests run, 0 failures, 0 errors, 0 skipped.
   - 27 unit tests (Luhn, ISO 7064 Mod 11,10, AES-256-GCM, Audit canonical string & sensitive payload filter, GlobalExceptionHandler, LogMaskingConverter, AdminBootstrapRunner).
   - 25 real database integration tests against `finserv_test` (Flyway migration verification on clean database, 24 core tables + triggers, table constraints, Maker-Checker rules, immutable trigger violations, UTC instant roundtrip mapping, audit hash chain integrity & tampering detection, pessimistic row-lock sequence concurrency).

3. **Start Application Against Dev Database**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   - Automatically applies migrations `V1_1` through `V1_8` + `V2` seed data to `finserv_db`.
   - Hibernate executes strict schema validation (`ddl-auto=validate`).
   - Admin bootstrap runner idempotently provisions superadmin.

4. **Verify Live Health & Documentation Endpoints**:
   - Health Probe: `GET http://localhost:8080/actuator/health` -> `{"status":"UP","groups":["liveness","readiness"]}`
   - Swagger UI: `GET http://localhost:8080/swagger-ui/index.html` -> HTTP 200
   - Security Baseline: `GET http://localhost:8080/api/v1/accounts` -> HTTP 403 (Deny by default)

---

## 6. Implementation Summary for Phase 1 (Completed)

All Phase 1 requirements have been implemented and verified with zero deviations from `docs/DATABASE_DESIGN.md`:
1. **Flyway Migrations (`V1_1`–`V1_8`, `V2`)**:
   - 24 core tables with strict FK RESTRICT, CHECK constraints, UNIQUE constraints, generated columns, and UTC timestamps.
   - Engine triggers on `audit_logs`, `gl_journal_entries`, `gl_ledger_postings` enforcing immutability.
   - Reference seeds: 5 standard roles, internal system daemon user, 10 GL accounts, 4 account products, headquarters branch (1001), sequence counters.
2. **JPA Entities & Repositories**:
   - Implemented with UUIDv7 generators for transactions, ledger entries, and audit logs.
   - `@Version` optimistic locking on accounts.
   - Insert-only immutable entity mapping for ledger and audit logs.
3. **Core Infrastructure Services**:
   - `NumberSequenceService`: `PESSIMISTIC_WRITE` row-locked sequence allocation with lazy annual sequence initialization.
   - `CustomerNumberGenerator`: 12-digit format with Luhn check digit.
   - `AccountNumberGenerator`: 14-digit format with ISO 7064 Mod 11,10 check digit.
   - `FieldEncryptionService`: AES-256-GCM authenticated encryption + HMAC-SHA256 blind indexing.
   - `AuditService`: Cryptographic hash chain with microsecond timestamp normalization and sensitive payload detection.
   - `AdminBootstrapRunner`: Idempotent superadmin bootstrapper reading from environment variables only.
4. **Cross-Cutting**:
   - `CorrelationIdFilter` + MDC propagation.
   - `LogMaskingConverter` for masking passwords, PII, and card data.
   - RFC 7807 `GlobalExceptionHandler` with zero leaked stack traces.
   - Spring Security deny-by-default baseline.

---

## 7. Pre-Approval Technical Audit & Verification Answers

### 1. Database Triggers on `finserv_db`
- **Live Database Inspection**: Query executed on `information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'finserv_db'`:
  ```text
  TRIGGER_NAME               EVENT_MANIPULATION  EVENT_OBJECT_TABLE   ACTION_TIMING
  trg_audit_logs_no_update   UPDATE              audit_logs           BEFORE
  trg_audit_logs_no_delete   DELETE              audit_logs           BEFORE
  trg_gl_journal_no_update   UPDATE              gl_journal_entries   BEFORE
  trg_gl_journal_no_delete   DELETE              gl_journal_entries   BEFORE
  trg_gl_postings_no_update  UPDATE              gl_ledger_postings   BEFORE
  trg_gl_postings_no_delete  DELETE              gl_ledger_postings   BEFORE
  ```
- **Explanation**: The migration script `V1_8__init_immutability_triggers.sql` and the MySQL schema in `finserv_db` define all **6 distinct triggers** exactly as specified in `docs/DATABASE_DESIGN.md` Section 3.8. The prior report's mention of 3 trigger names (`_no_update_delete`) was a phrasing inaccuracy in the markdown text that grouped the UPDATE and DELETE triggers by table. The migration script itself and the database have always had all 6 separate triggers.

### 2. Git State & Secret Isolation
- **Active Branch**: `phase-1-backend-foundation`
- **Last 10 Commits**:
  ```text
  530312c refactor(config): consolidate to single DotenvEnvironmentPostProcessor and remove redundant initializer
  ee4c36c feat(phase-1): complete backend foundation, logging, test hardening, and progress docs
  608da19 docs(phase-1): update README, PROGRESS, and TRACEABILITY for Phase 1
  2f2fb8a feat(backend): implement Spring Boot 3.3 core foundation, entities, services, and test suite
  878a871 feat(database): add admin init script and Flyway migrations V1_1 to V2
  4f2da85 docs: finalize database design revisions, fk creation order, audit hash chain, and traceability
  31b71db docs(phase-0): incorporate database design hardening and migration sequence split
  b65bade docs(phase-0): finalize database schema with maker-checker, number sequences, and UTC hardening
  5fcfeb7 docs(phase-0): incorporate database architecture review and enterprise constraints
  52376b2 docs(phase-0): requirements, architecture, database design, and traceability matrix
  ```
- **`backend/.env` Tracking Confirmation**:
  - `git ls-files backend/.env`: Returns empty (file is untracked).
  - `git status --ignored -s backend/.env`: Returns `!! backend/.env` (strictly ignored by `.gitignore`).

### 3. Schema Conformance, Dependencies & Lombok Verification
- **Deviations from `docs/DATABASE_DESIGN.md`**: **Zero deviations**. All 24 core tables, columns, data types (DECIMAL for amounts, CHAR(36) for UUIDs, DATETIME(6) for timestamps), CHECK constraints, UNIQUE constraints, RESTRICT foreign keys, generated columns (`active_app_marker`), and all 6 immutability triggers strictly match the design.
- **Dependencies Outside Approved List**:
  - `lombok`: **NOT used anywhere**. Lombok is completely absent from `pom.xml`, and no Lombok annotations (`@Data`, `@EqualsAndHashCode`, `@Getter`, `@Setter`) exist on any entity or class. All JPA entities use hand-crafted getters and setters with proper defensive copying.
  - `dotenv-java` (`io.github.cdimascio:dotenv-java`): The only external dependency added outside the standard Spring Boot starters. **Reason**: Added to fulfill the project rule: *"DB credentials live in backend/.env (DB_URL, DB_USERNAME, DB_PASSWORD). Read from environment only."* Since standard Spring Boot does not natively parse `.env` files from disk at local runtime without containerization, `dotenv-java` parses `backend/.env` into Spring's `EnvironmentPropertySource` before bean initialization.
  - All other dependencies (`web`, `validation`, `data-jpa`, `security`, `actuator`, `flyway-core`, `flyway-mysql`, `mysql-connector-j`, `java-uuid-generator`, `springdoc-openapi-starter-webmvc-ui`, `spring-boot-starter-test`, `spring-security-test`) are strictly on the approved list.

### 4. Audit Hash Chain & Tamper-Detection Test Mechanics
- **Hash Column Coverage**: The SHA-256 hash computed in `AuditService.calculateHash()` covers every single stored column in `audit_logs`:
  `chain_seq | id | created_at (normalized to micros) | event_type | entity_type | entity_id | actor_user_id | actor_role | action | ip_address | user_agent | correlation_id | payload_canonical | previous_hash`.
- **`payload_canonical` Storage**: Confirmed stored in `audit_logs.payload_canonical` as `LONGTEXT` with format `{"old":<old_json>,"new":<new_json>}`.
- **Tamper-Detection Test Mechanics**:
  - Because `trg_audit_logs_no_update` blocks any `UPDATE` command from all users, `AuditChainIntegrityIntegrationTest.shouldDetectTamperingWhenRecordAltered()` simulates a privileged database attacker (who possesses DDL privileges in the scratch test DB).
  - The test temporarily executes `DROP TRIGGER IF EXISTS trg_audit_logs_no_update`, executes an unauthorized SQL `UPDATE` altering `payload_canonical`, asserts that `auditService.verifyChain()` detects the cryptographic signature mismatch and returns `false`, and in a `finally` block recreates `trg_audit_logs_no_update` to restore trigger immutability.

### 5. Production Startup Failure on Missing `APP_ENCRYPTION_KEY`
- **Existing Test**: `com.finserv.common.security.FieldEncryptionServiceTest.shouldFailFastInProdIfKeyMissing()`:
  ```java
  @Test
  @DisplayName("Should fail fast in prod profile if key is missing")
  void shouldFailFastInProdIfKeyMissing() {
      MockEnvironment prodEnv = new MockEnvironment();
      prodEnv.setActiveProfiles("prod");

      FieldEncryptionService prodService = new FieldEncryptionService(prodEnv);
      assertThatThrownBy(prodService::init)
              .isInstanceOf(IllegalStateException.class)
              .hasMessageContaining("APP_ENCRYPTION_KEY is required in production");
  }
  ```
  This test passes in the test suite and verifies that when the active profile includes `prod` and the key is blank or unset, `FieldEncryptionService.init()` throws `IllegalStateException`.

### 6. Consolidation of Dotenv Loading Mechanism
- **Reason for Two Previously**: During initial multi-directory test harness debugging (running from repository root vs `backend/`), both an `ApplicationContextInitializer` and an `EnvironmentPostProcessor` were experimented with.
- **Consolidation**: Removed `DotenvContextInitializer.java` and `org.springframework.boot.env.EnvironmentPostProcessor.imports`. Retained **only** `DotenvEnvironmentPostProcessor` registered in `META-INF/spring.factories`.
- **Verification**: Executed full test suite (`mvn test` in `backend/`). All 52 tests (27 unit + 25 real database integration) pass with 0 failures, 0 errors, and 0 skipped.

---

## 8. Implementation Summary for Phase 2 (Completed)

All Phase 2 requirements have been implemented and verified with zero deviations from the project rules:

1. **Frontend Architecture & Setup**:
   - React 19 + TypeScript (strict mode with `noUncheckedIndexedAccess: true`) + Vite.
   - Vite proxy configured to forward `/api` and `/actuator` to `http://localhost:8080`.
   - Zero secrets: `.env.example` committed with non-sensitive `VITE_API_BASE_URL=/api/v1`.
   - Minimal justified dependencies: `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-select`, `lucide-react`, `decimal.js`.

2. **Token-Driven Design System (`src/styles/`)**:
   - Tier 1 Raw Tokens (`src/styles/tokens.css`): Neutrals (slate), Brand placeholder (navy/royal blue), Accent (gold), Semantic feedback (emerald success, amber warning, crimson danger, sky info), typography scale, spacing (4px base), radii, elevation shadows, motion durations/easings, breakpoints.
   - Tier 2 Semantic Tokens: Surface, text, border, and interaction mappings. Supports instant dark mode (`[data-theme='dark']`) and zero-component-touch brand token swap in Phase 3.
   - Accessible reset, focus rings, `.sr-only` accessibility classes, and `prefers-reduced-motion` compliance.

3. **Core Accessible UI Components (`src/components/ui/`)**:
   - 25 accessible components supporting default, hover, focus-visible, disabled, loading, and error states:
     - `Button`, `IconButton`, `Input`, `PasswordInput` (toggle visibility), `Textarea`, `Select`, `Checkbox`, `Radio`, `RadioGroup`, `Switch`, `FormField` (accessible aria wiring, error alerts), `Card` (compound components), `Badge`, `StatusPill` (10 banking lifecycle statuses), `Modal`, `ConfirmDialog` (Radix Dialog with focus trap), `Tabs` (Radix Tabs with keyboard nav), `Table` (responsive card collapse), `Pagination`, `ToastContainer` / `ToastProvider`, `Skeleton`, `Spinner`, `EmptyState`, `ErrorState` (correlation ID copy), `Stepper` (6-step progressive onboarding), `AmountDisplay` (lakh/crore INR formatting), `Breadcrumbs`.
   - Automated a11y checks: `jest-axe` audits passing on `Button`, `FormField`, `AmountDisplay`, `Tabs`, `Modal`.

4. **Shared Banking Utilities & Tests (`src/lib/`)**:
   - **Financial Precision (`src/lib/money.ts`)**: Pure `decimal.js` arithmetic with `ROUND_HALF_EVEN` (Banker's Rounding). Indian numbering format (`formatINR`: ₹ 1,23,45,678.90), paise conversions (`toPaise`, `fromPaise`), zero floating-point operations.
   - **Asia/Kolkata Dates (`src/lib/dates.ts`)**: Formats UTC instants for `Asia/Kolkata` (`UTC+05:30`), with strict midnight boundary and relative time support.
   - **Masking (`src/lib/masking.ts`)**: Accounts (`••••••••••0017`), phone numbers (`+91 ••••••3210`), emails (`a••••••••r@domain`), PAN (`•••••••34F`).
   - **Validation (`src/lib/validation.ts`)**: Zod schemas for Indian mobile, email, PAN, IFSC, and currency amounts.
   - **Idempotency (`src/lib/idempotency.ts`)**: RFC 4122 v4 UUID generator for standard `Idempotency-Key` header (one unique UUID per submit attempt).

5. **Typed API Client & RFC 7807 Error Mapper (`src/lib/api-client.ts`)**:
   - Request interceptors: `X-Correlation-ID`, standard `Idempotency-Key`, timeout cancellation.
   - Endpoint routing: `/actuator/*` routed directly to the Actuator probe without `/api/v1` prefix.
   - Response interceptors: Maps RFC 7807 Problem Details and network drops into normalized `AppError`.
   - Live Actuator probe: `GET /actuator/health` displayed in the status widget and `/design-system` (live `status: UP`).

6. **Dev-Only Living Style Guide (`/design-system`)**:
   - Interactive catalog displaying all 25 components, states, forms, validation, and real-time backend health probe.
   - Conditionally mounted via `import.meta.env.DEV` and 100% tree-shaken from production bundles (`DesignSystemPage`: 0, `design-system`: 0, `Living Style Guide`: 0 in `dist/`).

7. **Accessibility, Contrast & Responsive Verification**:
   - Real-browser axe-core contrast audit on `/design-system` passing with **0 violations** on both Light Theme and Dark Theme.
   - Mobile navigation drawer upgraded to Radix Dialog: traps keyboard focus inside drawer and restores focus to the menu trigger button on close (verified by automated test `AppLayout.test.tsx`).
   - High-fidelity Playwright screenshots captured at 360px, 768px, and 1280px for `/`, `/app`, and `/design-system` in `docs/evidence/phase-2/`.
   - `npm audit` verified with 0 vulnerabilities.

---

## 9. How to Run & Verify Phase 2

1. **Verify Git Branch**:
   ```bash
   git branch
   ```
   *Expected output*: On branch `phase-2-frontend-foundation`.

2. **Execute Frontend Verification Suite**:
   ```bash
   cd frontend
   npm run lint        # Expected: 0 errors, 0 warnings
   npm run type-check   # Expected: 0 errors
   npm test            # Expected: 11 test suites, 80 tests passing (including jest-axe a11y)
   npm run build       # Expected: Clean production build
   ```

3. **Verify Dev-Only Route Tree-Shaking**:
   ```bash
   # Confirm /design-system is omitted from production output:
   grep -rn "Living Style Guide" dist/
   # Expected output: (empty / 0 matches)
   ```

4. **Launch Dev Server with Live Backend Proxy**:
   ```bash
   npm run dev
   ```
   - Open `http://localhost:5173/` for the public app shell.
   - Open `http://localhost:5173/app` for the core banking app layout with desktop sidebar and mobile drawer.
   - Open `http://localhost:5173/design-system` for the living component catalog and live Actuator health probe.

5. **Verify Backend Zero Regression**:
   ```bash
   cd ../backend
   mvn test
   ```
   *Expected output*: 52 tests run, 0 failures, 0 errors, 0 skipped.

---

## 10. Phase 3 Execution & Verification Details

### A. Branding, Typography & Motion Tokens
- Official brand mark ingested: `frontend/public/finserv-logo.svg` and `frontend/public/finserv-mark.svg`.
- Component: `BrandLogo.tsx` with `size` (`sm`, `md`, `lg`), `variant` (`full`, `mark`), and accessible labels.
- Once-per-session intro animation: `LogoIntro.tsx` guarded by `sessionStorage.getItem('finserv_logo_intro_seen')`, dismissible via `Escape` key or click, and fully deactivated when `prefers-reduced-motion` is detected.
- Token refinement in `tokens.css`: Navy/Slate surface palette, Teal/Gold accents, high contrast ratios (WCAG AA conformant), and monospace formatting for numbers.

### B. Authentication, JWT & Session Management
- **Backend API (`/api/v1/auth/*`)**:
  - `POST /register`: BCrypt password hashing, unverified status (`PENDING_VERIFICATION`), default `ROLE_CUSTOMER`, initial JWT session, tamper-evident audit logging (`USER_REGISTERED`).
  - `POST /login`: Username or email authentication, 15-minute account lock upon 5 consecutive failed attempts, audit logging (`LOGIN`, `LOGIN_FAILED`).
  - `POST /refresh`: Thread-safe refresh token rotation, replay attack detection with full token family revocation and security audit logging.
  - `POST /logout`: Active refresh token revocation and audit logging (`LOGOUT`).
  - `GET /me`: Returns authenticated `UserSummary` with current roles and verification status.
  - Demo OTP Verification (`POST /verify-contact/send`, `POST /verify-contact/confirm`): backed by `otp_challenges` table with rate-limiting, 3-attempt lock, expiry, and local dev simulation logging for end-to-end testing without external SMS provider costs.
  - JWT Security Filter (`JwtAuthenticationFilter`): extracts Bearer tokens, populates `SecurityContext` with `UserPrincipal`, and enforces role-based access.

### C. Progressive Customer Onboarding & KYC
- **Backend API (`/api/v1/onboarding/*`)**:
  - `GET /application`: Fetches or initializes a single open draft onboarding application for the authenticated customer.
  - `PUT /application/step/{step}`: Step-by-step progress persistence (Steps 1–5) storing draft JSON.
  - `POST /application/submit`: Atomic `@Transactional` boundary validating all mandatory steps, creating linked records in `customers`, `kyc_documents`, and `customer_declarations`, verifying duplicate PAN prevention (cross-checking customer PAN blind-index hash and active submitted applications), updating status to `SUBMITTED`, and recording audit event `ONBOARDING_APPLICATION_SUBMITTED`.
- **Frontend Flow (`/onboarding`)**:
  - Built with the Phase 2 `Stepper` component into 5 progressive steps (NEVER a single giant form):
    1. *Verification*: Contact OTP challenge for registered email and phone number.
    2. *Personal*: Name, DOB (enforcing 18+ age validation), gender, marital status, nationality.
    3. *Declarations*: Residential address, FATCA self-certification, PEP declaration, Terms & Privacy consent.
    4. *KYC Details*: PAN validation (`[A-Z]{5}[0-9]{4}[A-Z]{1}`) with explanatory legal requirement tooltip, Government ID selection, and mock file upload.
    5. *Review & Submit*: Summary verification screen with legal affirmation.
  - Once submitted, transitions directly to the *Verification Pending Status Tracker* screen displaying application reference ID, 3-stage progression indicator, security confidentiality badge, and real-time status polling.

---

## 11. How to Run & Verify Phase 3

1. **Verify Git Branch**:
   ```bash
   git branch
   ```
   *Expected output*: On branch `phase-3-auth-kyc-branding`.

2. **Run Full Backend Verification Suite**:
   ```bash
   cd backend
   mvn test
   ```
   *Expected output*: 61 tests run, 0 failures, 0 errors, BUILD SUCCESS.

3. **Run Full Frontend Verification Suite**:
   ```bash
   cd ../frontend
   npm run lint        # Expected: 0 errors, 0 warnings
   npm run typecheck   # Expected: 0 errors
   npm test            # Expected: 15 test files, 94 tests passing
   npm run build       # Expected: Clean production build with Vite
   ```

4. **Run Live End-to-End Local Development Environment**:
   ```bash
   # Terminal 1: Backend
   cd backend
   mvn spring-boot:run

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```
   - Navigate to `http://localhost:5173/register` to create a new banking customer profile.
   - You will automatically be guided to `http://localhost:5173/onboarding` to complete the 5-step stepper.
   - Use simulated OTP shown in backend console or on-screen demo banner.
   - Upon final submission, observe transition to the "Application Under Bank Review" tracker.
   - Observe protected route guard redirecting unverified customers away from `/app` until verified in Phase 6.

---

## 12. Phase 4 Execution & Verification Details (Completed)

### A. Account Management & Opening Engine
- **Flyway Migrations (`V3`, `V4`)**:
  - `V3__init_beneficiaries_schema.sql`: Defined `beneficiaries` table with foreign key to `customers`, indexes on `(customer_id, is_active)`, unique constraint on `(customer_id, account_number, ifsc_code)`, and reference seed branches (`1002` Bangalore, `1003` Delhi).
  - `V4__add_account_controls_and_branch_to_applications.sql`: Added `nickname` column to `accounts` and foreign key `branch_id` to `account_applications`.
- **Customer Auto-Provisioning (`CustomerLookupService`)**:
  - Automatically provisions a verified customer record with a 12-digit Luhn CIF, AES-256-GCM encrypted PAN, and HMAC-SHA256 blind index from onboarding data when an active application is approved or auto-activated. Prevents developer test deadlocks prior to full Employee Maker-Checker approval portal in Phase 6.
- **Collision-Free Account Number Generator**:
  - Adheres strictly to `docs/DATABASE_DESIGN.md` Section 3.3.
  - 14 digits format: `4-digit Branch Code` + `2-digit Product Code` + `7-digit Sequential Counter` + `1-digit ISO 7064 Mod 11,10 Check Digit`.
  - Concurrency protected by pessimistic row locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on `number_sequences` using key `account_num_seq`.
- **Account Endpoints (`/api/v1/accounts/*`)**:
  - `GET /api/v1/products/accounts`: Returns active savings and current account products with interest rates and minimum balance constraints.
  - `GET /api/v1/branches`: Returns active branches with branch codes and IFSC codes.
  - `POST /api/v1/accounts/applications`: Submits account applications with support for standard pending review or instant auto-activation for verified customers.
  - `GET /api/v1/accounts`: Lists all accounts owned by the authenticated customer. Strictly enforces ownership checks.
  - `GET /api/v1/accounts/{accountId}`: Fetches details for a single account owned by the customer, supporting masked and unmasked account number toggles.
  - `PATCH /api/v1/accounts/{accountId}/controls`: Updates account preferences (e.g. account nickname) and records audit logs.
  - `GET /api/v1/accounts/applications`: Lists all account applications submitted by the customer with review statuses.
- **Financial Safety**:
  - Balances are strictly represented as `BigDecimal` serialized to exact 2-decimal strings (`currentBalance`, `holdBalance`, `availableBalance`). No floating point numbers.
  - All mutating operations generate tamper-evident audit logs (`ACCOUNT_OPENED`, `ACCOUNT_APPLICATION_SUBMITTED`, `ACCOUNT_CONTROLS_UPDATED`).

### B. Beneficiary Management Engine
- **Beneficiary Endpoints (`/api/v1/beneficiaries/*`)**:
  - `GET /api/v1/beneficiaries`: Lists all active beneficiaries for the customer with search and category filtering.
  - `POST /api/v1/beneficiaries`: Validates account confirmation match, IFSC regex (`^[A-Z]{4}0[A-Z0-9]{6}$`), uniqueness per customer, and blocks self-account addition. Supports internal FinServ account lookup vs other banks.
  - `POST /api/v1/beneficiaries/{id}/verify`: Simulates 6-digit OTP verification to transition beneficiary from `PENDING_VERIFICATION` to `VERIFIED`.
  - `DELETE /api/v1/beneficiaries/{id}`: Soft-deletes/deactivates beneficiary (`isActive = false`).
- **Cooling-Off Period Safeguard**:
  - Applies a 24-hour cooling-off window during which transfer limits can be capped or monitored.
- **Audit Logging**:
  - Records events `BENEFICIARY_CREATED`, `BENEFICIARY_VERIFIED`, and `BENEFICIARY_DEACTIVATED`.

### C. Frontend Accounts & Beneficiaries UI
- **Accounts (`/app/accounts`)**:
  - Total Available Balance overview banner with exact INR formatting via `formatINR`.
  - Premium FinServ Account Cards with masked/unmasked toggle (`••••••••••0017`), one-click clipboard copy for Account Number and IFSC with toast feedback, balance breakdown, status pill, and branch details.
  - Account Details Modal with full ledger balance breakdown (Gross, Hold, Net Available) and ISO 7064 compliance badge.
  - Account Controls Modal for updating account nickname with real-time UI refresh.
  - "Open New Account" Multi-step Modal with product comparison (Savings vs Current), branch selection, initial deposit input, and double-submit + `Idempotency-Key` protection.
  - Pending Applications alert banner showing submitted applications awaiting bank review.
- **Beneficiaries (`/app/beneficiaries`)**:
  - Payee listing with search filter and category tabs (All, Within FinServ, Other Banks, Pending Verification).
  - FinServ Intra-Bank vs Other Bank badges, copyable account numbers, cooling-off indicators, and quick action buttons.
  - "Add Beneficiary" Modal with React Hook Form + Zod schema validation (confirm account number match, IFSC regex), followed by a simulated 6-digit OTP modal.
  - Direct OTP Verification Modal for payees pending verification.
  - Delete Confirmation Dialog before removing a beneficiary.

---

## 13. How to Run & Verify Phase 4

1. **Verify Git Branch**:
   ```bash
   git branch
   ```
   *Expected output*: On branch `phase-4-accounts-beneficiaries`.

2. **Run Full Backend Verification Suite**:
   ```bash
   cd backend
   mvn test
   ```
   *Verification Result*: **70 tests run, 0 failures, 0 errors, 0 skipped, BUILD SUCCESS**.
   - 3 integration tests in `AccountIntegrationTest`: Product/branch listing, account application and auto-activation, account ownership security checks (Customer A cannot access Customer B's account).
   - 6 integration tests in `BeneficiaryIntegrationTest`: Intra-bank & inter-bank beneficiary creation, self-account rejection, duplicate rejection, simulated OTP verification, soft-deletion.

3. **Run Full Frontend Verification Suite**:
   ```bash
   cd frontend
   npm run lint        # Expected: 0 errors, 0 warnings
   npm run typecheck   # Expected: 0 errors
   npm test            # Expected: 17 test files, 101 tests passing
   npm run build       # Expected: Clean production build with Vite
   ```
   *Verification Result*:
   - `npm run lint`: **0 errors, 0 warnings**.
   - `npm run typecheck`: **0 errors**.
   - `npm test`: **17 test files, 101 tests passed, 0 failures** (including `AccountsPage.test.tsx` and `BeneficiariesPage.test.tsx`).
   - `npm run build`: **Built in ~1s** (`dist/` generated with zero errors).

4. **Run Live Application**:
   ```bash
   # Terminal 1: Backend
   cd backend
   mvn spring-boot:run

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```
   - Log in at `http://localhost:5173/login`.
   - Open Accounts page at `http://localhost:5173/app/accounts`:
     - View active accounts, toggle masked account numbers, click "Open New Account".
     - Submit account application and observe instant account card creation with ISO 7064 account number.
   - Open Beneficiaries page at `http://localhost:5173/app/beneficiaries`:
     - Click "Add Beneficiary", enter details, submit, and confirm with demo OTP `123456`.
     - Observe verified payee card with bank type badge and copyable details.
---

## 14. Phase 4 UI/UX Visual Overhaul & Evidence

Following the dedicated UI/UX review request, a complete visual and micro-interaction overhaul was executed across the App Shell, Auth, Onboarding, Accounts, and Beneficiaries interfaces with zero backend or logic regressions:

1. **Global Theme, Depth & App Shell (`tokens.css`, `layout.css`, `components.css`, `AppLayout.tsx`)**:
   - Upgraded surface hierarchy with `#F4F7FB` slate-blue canvas, crisp elevated white surfaces, multi-layered elevation shadows (`--shadow-card-elevated`), and clean subtle borders (`rgba(15, 23, 42, 0.08)`).
   - Sidebar redesigned in rich Executive Navy gradient (`#0A1628` to `#0F2342`) with glowing active navigation indicators, bank logo mark, and profile footer showing customer KYC status and branch.
   - Polished top navigation header with quick search/command pill (`⌘K`), environment badge ("LIVE SIMULATION / RBI PILOT"), and interactive user avatar pill.

2. **Luxury Private-Banking Account Cards (`/app/accounts`)**:
   - Luxury fintech debit/account cards with rich midnight-navy and emerald mesh gradients, geometric SVG radar watermarks, and realistic EMV gold chip illustration.
   - Crisp tabular balance display (`formatINR`) with sub-rows for current and hold balances.
   - Frosted account number bar with masked/unmasked toggle (`•••• •••• 1234`) and instant copy buttons with toast feedback.
   - Relationship overview hero card with Net Available Funds, DICGC insurance guarantee badge, and portfolio metrics.
   - "Open New Account" product tier comparison selector with interest rates (`% p.a.`), minimum balance requirements, and perk checklists.

3. **Modern Beneficiary Directory (`/app/beneficiaries`)**:
   - Modern directory grid with colour-coded initials avatars (`AS`, `RV`, `MP`), monospace IFSC badges, Within FinServ vs External Bank tags, and cooling-off alerts.
   - Instant search and category filter pills (`All Payees`, `Within FinServ`, `Other Banks`, `Pending OTP`).
   - Clean "Add Beneficiary" and "Verify OTP" modals with clear visual hierarchy and inline icons.

4. **Split-Screen Executive Auth & Onboarding Stepper**:
   - Desktop split-screen layout for `/login` and `/register`: deep navy FinServ security showcase on the left (256-bit AES encryption, double-entry ledger guarantee, RBI-grade security) paired with an elevated auth card on the right.
   - Onboarding stepper with time estimate, animated progress track, and 3-stage Verification Status Tracker.

5. **Visual Evidence Gallery (`docs/evidence/phase-4/`)**:
   - `01-login-desktop.png`: Executive split-screen login layout (1280px).
   - `02-register-desktop.png`: Executive split-screen registration layout (1280px).
   - `03-accounts-desktop.png`: Net Funds summary, luxury account cards, and masked toggle (1280px).
   - `04-open-account-modal-desktop.png`: Product tier comparison modal with perks (1280px).
   - `05-beneficiaries-desktop.png`: Payee directory with initials avatars and filter pills (1280px).
   - `06-add-beneficiary-modal-desktop.png`: Modal for intra/inter bank payee creation (1280px).
   - `07-onboarding-tracker-desktop.png`: Verification tracker for pending KYC review (1280px).
   - `07b-onboarding-stepper-desktop.png`: 5-step progressive onboarding journey (1280px).
   - `08-login-mobile.png`: Responsive mobile login view (375px).
   - `09-accounts-mobile.png`: Responsive mobile account cards & stats view (375px).
   - `10-beneficiaries-mobile.png`: Responsive mobile payee cards & filters view (375px).
