# FINServ — Engineering Progress & Roadmap Log

## 1. Project Overview & Current State

- **Current Milestone**: Phase 2 — Frontend Foundation + Design System
- **Phase Status**: `COMPLETED` (Ready for user approval)
- **Active Git Branch**: `phase-2-frontend-foundation`
- **Current Target**: Phase 3 — Branding, Assets, Typography, Motion System

---

## 2. Milestone Execution Status

| Phase | Milestone Name | Status | Branch | Notes / Completion Evidence |
| :---: | :--- | :--- :---: | :--- | :--- |
| **0** | **Requirements, Architecture, DB Design, Traceability** | **COMPLETED** | `phase-0-requirements-architecture-db` | All specifications, ERD, and traceability delivered in `docs/`. |
| **1** | **Backend Foundation + Core Database** | **COMPLETED** | `phase-1-backend-foundation` | 24 core tables + triggers (`V1_1`–`V1_8`, `V2`), Flyway, JPA, UUIDv7, Audit Hash Chain, AES-256-GCM, ISO 7064/Luhn generators, 52 automated tests passing, Actuator `/actuator/health` UP, Swagger UI verified. |
| **2** | **Frontend Foundation + Design System** | **COMPLETED** | `phase-2-frontend-foundation` | React 19 + TypeScript (strict, `noUncheckedIndexedAccess`), Vite proxy, Tier 1/2 Vanilla CSS tokens, 25 UI components with all states, Radix UI headless primitives, Decimal.js money math (`ROUND_HALF_EVEN`), Asia/Kolkata dates, masking, Zod schemas, RFC 7807 error mapper, Actuator health probe, dev-only `/design-system` catalog (tree-shaken from prod), 80 Vitest unit/a11y tests passing, 0 lint/typecheck errors. |
| **3** | Branding, Assets, Typography, Motion System | `NOT STARTED` | - | Official logo, accessible micro-interactions. |
| **4** | Auth, JWT, Sessions, Authorization | `NOT STARTED` | - | Spring Security 6, JWT dual-token, RBAC. |
| **5** | Progressive Registration, Onboarding, KYC | `NOT STARTED` | - | 6-step progressive wizard, tiered KYC verification. |
| **6** | Customer, Branch, Employee Management | `NOT STARTED` | - | Customer 360, branch directory, staff scoping. |
| **7** | Account Applications, Opening, Management | `NOT STARTED` | - | Savings/Current products, Luhn account generator. |
| **8** | Beneficiaries & Payees | `NOT STARTED` | - | Intra/Inter-bank payee setup, cooling-off rules. |
| **9** | Deposits, Withdrawals, Transfers, Ledger, Safety | `NOT STARTED` | - | Double-entry ledger, pessimistic locks, idempotency. |
| **10**| Transaction History, Statements, Receipts | `NOT STARTED` | - | PDF statements, cryptographic digital receipts. |
| **11**| Customer Dashboard + Core-Banking Navigation | `NOT STARTED` | - | Responsive web client, balance overview, quick pay. |
| **12**| Employee Portal, Admin Portal, Audit Operations | `NOT STARTED` | - | Teller desk, supervisor overrides, audit logs. |
| **13**| Core-Banking UI/UX Polish + Responsive QA | `NOT STARTED` | - | WCAG 2.1 AA accessibility, Lighthouse optimization. |
| **14**| Notifications, Support, Disputes | `NOT STARTED` | - | Webhooks, support tickets, dispute chargebacks. |
| **15**| FD/RD and Deposit Products | `NOT STARTED` | - | Term deposit creation, compounding, liquidation. |
| **16**| Loans, EMI, Repayments | `NOT STARTED` | - | Amortization schedule, reducing-balance EMI math. |
| **17**| Cheques + Additional Services | `NOT STARTED` | - | Cheque book leaf lifecycle, Positive Pay system. |
| **18**| Bills, Recharge, External Payments | `NOT STARTED` | - | Multi-category biller simulator, auto-pay mandates. |
| **19**| Cards and UPI Integrations | `NOT STARTED` | - | Virtual cards, card controls, UPI VPA & QR codes. |
| **20**| Investments, Insurance, Rewards, Offers | `NOT STARTED` | - | Mutual fund SIP, insurance, loyalty cashback. |
| **21**| Fraud/Risk Controls + Analytics | `NOT STARTED` | - | Velocity checks, risk scoring, AML alerts. |
| **22**| Full-Stack Integration, Security, Regression | `NOT STARTED` | - | End-to-end integration test suite, OWASP checks. |
| **23**| Documentation, Final QA, Release Readiness | `NOT STARTED` | - | Release verification, runbooks, limitations report. |

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
   - **Idempotency (`src/lib/idempotency.ts`)**: RFC 4122 v4 UUID generator for `X-Idempotency-Key`.

5. **Typed API Client & RFC 7807 Error Mapper (`src/lib/api-client.ts`)**:
   - Request interceptors: `X-Correlation-ID`, `X-Idempotency-Key`, timeout cancellation.
   - Response interceptors: Maps RFC 7807 Problem Details and network drops into normalized `AppError`.
   - Live Actuator probe: `GET /actuator/health` displayed in the status widget and `/design-system`.

6. **Dev-Only Living Style Guide (`/design-system`)**:
   - Interactive catalog displaying all 25 components, states, forms, validation, and real-time backend health probe.
   - Conditionally mounted via `import.meta.env.DEV` and 100% tree-shaken from production bundles.

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

