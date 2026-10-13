# FINServ — Engineering Progress & Roadmap Log

## 1. Project Overview & Current State

- **Current Milestone**: Phase 0 — Requirements, Architecture, Database Design & Traceability
- **Phase Status**: `COMPLETED` (Docs only, awaiting formal user approval)
- **Active Git Branch**: `phase-0-requirements-architecture-db`
- **Current Target**: Phase 1 — Backend Foundation + Core Database

---

## 2. Milestone Execution Status

| Phase | Milestone Name | Status | Branch | Notes / Completion Evidence |
| :---: | :--- | :---: | :--- | :--- |
| **0** | **Requirements, Architecture, DB Design, Traceability** | **COMPLETED** | `phase-0-requirements-architecture-db` | All specifications, ERD, and traceability delivered in `docs/`. |
| **1** | Backend Foundation + Core Database | `PLANNED` | `phase-1-backend-foundation` | Planned Flyway migrations, JPA entities, health, Swagger. |
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

## 5. How to Run & Verify Phase 0

1. **Verify Git Branch & Status**:
   ```bash
   git branch
   git status
   ```
   *Expected output*: On branch `phase-0-requirements-architecture-db`, working tree clean.

2. **Verify Specifications in `docs/`**:
   - Requirements: `docs/REQUIREMENTS.md`
   - Architecture: `docs/ARCHITECTURE.md`
   - Database Design: `docs/DATABASE_DESIGN.md`
   - Traceability Matrix: `docs/TRACEABILITY.md`
   - Risks & Dependencies: `docs/RISKS_AND_DEPENDENCIES.md`
   - Progress Log: `docs/PROGRESS.md`

3. **Configure Local DB Credentials for Phase 1**:
   Copy `backend/.env.example` to `backend/.env` and update `DB_PASSWORD` with your local MySQL password:
   ```bash
   copy backend\.env.example backend\.env
   ```

---

## 6. Exact Implementation Plan for Phase 1 (Backend Foundation + Core Database)

Upon user approval (`APPROVE PHASE`), the following sequential plan will be executed:
1. **Branch Checkout**: Create and switch to `phase-1-backend-foundation`.
2. **Backend Project Initialization**:
   - Generate `backend/pom.xml` configured for Java 21+ with Spring Boot 3.3.x.
   - Configure dependencies: Spring Boot Web, Spring Data JPA, Spring Security, Validation, Actuator, Flyway (Core + MySQL), MySQL Connector, Lombok, Springdoc OpenAPI 3.0, JJWT, Dotenv Java.
3. **Application Properties & Profile Setup**:
   - Configure `application.yml` and `application-dev.yml` to inject DB URL, username, and password dynamically from `backend/.env`.
   - Set `spring.jpa.hibernate.ddl-auto=validate`.
4. **Flyway Migrations (22 Core Foundation Tables)**:
   - Create `V1__init_core_schema.sql` implementing the 22 core baseline tables:
     1. Identity & Auth: `roles`, `users`, `user_roles`, `refresh_tokens`, `otp_challenges`
     2. Onboarding, Customer & KYC: `onboarding_applications`, `customers`, `customer_declarations`, `addresses`, `kyc_documents`
     3. Organization & Staff: `branches`, `employees`
     4. General Ledger: `gl_chart_of_accounts`, `gl_journal_entries`, `gl_ledger_postings`
     5. Products & Accounts: `account_products`, `account_applications`, `accounts`, `account_holds`
     6. Transactions & Idempotency: `idempotency_records`, `transactions`
     7. Audit: `audit_logs`
   - Create `V2__seed_reference_data.sql` implementing idempotent dev seed data: initial roles (`ROLE_CUSTOMER`, `ROLE_EMPLOYEE`, `ROLE_MANAGER`, `ROLE_ADMIN`, `ROLE_COMPLIANCE`), 10 standard GL chart of accounts, standard banking products (`SAVINGS`, `CURRENT`, `SALARY`, `STUDENT`), and initial headquarters branch.
5. **Core JPA Entities & Audit Listeners**:
   - Implement `BaseEntity`, `AuditableEntity`, and JPA Auditing configuration.
   - Implement JPA entity mappings for core entities with `ON DELETE RESTRICT` semantics and encrypted PII converter attributes.
6. **Error Handling Architecture**:
   - Implement centralized `GlobalExceptionHandler` mapping RFC 7807 problem details to `ApiResponse<T>` and `ErrorResponse`.
7. **Health, Actuator & OpenAPI Swagger**:
   - Configure `/actuator/health` and `/actuator/info`.
   - Configure OpenAPI/Swagger at `/swagger-ui.html` and `/v3/api-docs`.
8. **Automated Verification & Tests**:
   - Execute `mvn clean compile test` to verify zero compile or migration failures.
   - Verify health check and Swagger documentation endpoints.
