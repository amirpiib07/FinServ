# FINServ — Engineering Progress & Roadmap Log

## 1. Project Overview & Current State

- **Current Milestone**: Phase 1 — Backend Foundation + Core Database
- **Phase Status**: `COMPLETED` (Ready for user approval)
- **Active Git Branch**: `phase-1-backend-foundation`
- **Current Target**: Phase 2 — Frontend Foundation + Design System

---

## 2. Milestone Execution Status

| Phase | Milestone Name | Status | Branch | Notes / Completion Evidence |
| :---: | :--- | :--- :---: | :--- | :--- |
| **0** | **Requirements, Architecture, DB Design, Traceability** | **COMPLETED** | `phase-0-requirements-architecture-db` | All specifications, ERD, and traceability delivered in `docs/`. |
| **1** | **Backend Foundation + Core Database** | **COMPLETED** | `phase-1-backend-foundation` | 24 core tables + triggers (`V1_1`–`V1_8`, `V2`), Flyway, JPA, UUIDv7, Audit Hash Chain, AES-256-GCM, ISO 7064/Luhn generators, 52 automated tests passing (27 unit + 25 real DB integration), clean package build, Actuator `/actuator/health` UP, Swagger UI verified, Admin bootstrap verified. |
| **2** | Frontend Foundation + Design System | `NOT STARTED` | - | React + TypeScript + Vite + Vanilla CSS tokens. |
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
