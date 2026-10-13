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
| **P0-DOC-05** | Phase 0 | Database Relational Design & ERD | `docs/DATABASE_DESIGN.md` | MySQL 8.0 schema plan (24 core tables, CHECKs, RESTRICT FKs, UUIDv7, Audit Hash Chain, Maker-Checker) | DDL syntax verification | `IMPLEMENTED` |
| **P0-DOC-06** | Phase 0 | Master Traceability Matrix | `docs/TRACEABILITY.md` | None (Specification) | Document review | `IMPLEMENTED` |
| **P0-DOC-07** | Phase 0 | Risks & External Dependencies Register | `docs/RISKS_AND_DEPENDENCIES.md` | None (Specification) | Document review | `IMPLEMENTED` |
| **P0-DOC-08** | Phase 0 | Progress Tracking & Execution Plan | `docs/PROGRESS.md` | None (Specification) | Document review | `IMPLEMENTED` |
| **P1-BE-01** | Phase 1 | Spring Boot 3.x project setup & build | `backend/pom.xml` | Spring Boot 3.3.x, JDK 21+ | `mvn clean compile` | `NOT STARTED` |
| **P1-BE-02** | Phase 1 | Flyway migration engine & 24 core tables schema | `backend/src/main/resources/db/migration` | Flyway, MySQL `schema_version` (`V1__init_core_schema.sql`, `V2__seed_reference_data.sql`) | Migration integration test | `NOT STARTED` |
| **P1-BE-03** | Phase 1 | Core JPA Entities & Base Models (24 tables, RESTRICT FKs, Encrypted PII) | `com.finserv.common.model`, `com.finserv.modules.*.entity` | JPA / Hibernate, MySQL | Entity mapping test | `NOT STARTED` |
| **P1-BE-04** | Phase 1 | Centralized RFC 7807 Exception Handling | `com.finserv.common.exception` | Spring Web MVC | MockMvc exception test | `NOT STARTED` |
| **P1-BE-05** | Phase 1 | Health Check, Actuator & OpenAPI/Swagger | `com.finserv.config.OpenApiConfig` | Spring Actuator, Springdoc | `GET /actuator/health`, `/swagger-ui.html` | `NOT STARTED` |
| **P2-FE-01** | Phase 2 | React + TypeScript + Vite foundation | `frontend/package.json` | Vite, Node.js | `npm run build` | `NOT STARTED` |
| **P2-FE-02** | Phase 2 | Custom CSS Design System & Token Architecture | `frontend/src/index.css` | Vanilla CSS tokens | Vitest component tests | `NOT STARTED` |
| **P2-FE-03** | Phase 2 | Core UI Components (Button, Input, Card, Modal) | `frontend/src/components/ui/` | Design system tokens | Story/render test | `NOT STARTED` |
| **P3-BRAND-01** | Phase 3 | Brand asset ingestion & typography system | `frontend/src/assets/`, `docs/brand/` | Official SVG logo, Inter font | Visual inspection | `NOT STARTED` |
| **P3-MOTION-02** | Phase 3 | Micro-interactions & accessible motion system | `frontend/src/styles/motion.css` | CSS keyframes, `prefers-reduced-motion` | A11y motion check | `NOT STARTED` |
| **P4-AUTH-01** | Phase 4 | User registration & BCrypt hashing | `com.finserv.modules.auth` | `users`, `roles`, `user_roles` | Auth unit/integration tests | `NOT STARTED` |
| **P4-AUTH-02** | Phase 4 | Stateless JWT login & refresh token rotation | `com.finserv.security` | `POST /api/v1/auth/login`, `refresh_tokens` | Token issue & rotate tests | `NOT STARTED` |
| **P4-AUTH-03** | Phase 4 | Account lockout & session management | `com.finserv.modules.auth.service` | `users.failed_login_attempts` | 5-failure lockout test | `NOT STARTED` |
| **P4-AUTH-04** | Phase 4 | Frontend auth state & protected routes | `frontend/src/context/AuthContext.tsx` | Local storage, JWT interceptor | Route guard test | `NOT STARTED` |
| **P5-KYC-01** | Phase 5 | Progressive 6-step registration journey | `frontend/src/features/onboarding/` | `onboarding_applications`, `customer_declarations` | Step progression tests | `NOT STARTED` |
| **P5-KYC-02** | Phase 5 | Contact OTP verification (simulated) | `com.finserv.modules.kyc` | `POST /api/v1/kyc/verify-otp`, `otp_challenges` | OTP expiry test | `NOT STARTED` |
| **P5-KYC-03** | Phase 5 | KYC document upload & encrypted metadata | `com.finserv.modules.kyc` | `POST /api/v1/kyc/documents`, `kyc_documents` | File upload test | `NOT STARTED` |
| **P5-KYC-04** | Phase 5 | Tiered KYC state machine & maker-checker review | `com.finserv.modules.kyc.service` | `customers.kyc_status`, `onboarding_applications` | Status transition tests | `NOT STARTED` |
| **P6-CRM-01** | Phase 6 | Customer 360 profile management | `com.finserv.modules.customer` | `GET /api/v1/customers/me`, `customers` | Profile fetch test | `NOT STARTED` |
| **P6-BRN-02** | Phase 6 | Branch directory & routing codes | `com.finserv.modules.branch` | `branches` | Branch lookup test | `NOT STARTED` |
| **P6-EMP-03** | Phase 6 | Staff management & branch scoping | `com.finserv.modules.branch.service` | `employees`, `branches` | Staff scope test | `NOT STARTED` |
| **P7-ACC-01** | Phase 7 | Account application & maker-checker opening engine | `com.finserv.modules.account` | `POST /api/v1/accounts`, `account_applications`, `accounts` | Account creation test | `NOT STARTED` |
| **P7-ACC-02** | Phase 7 | 14-digit ISO 7064 Mod 97-10 account number generator | `com.finserv.modules.account.util` | Branch + Product + Sequence + Check-Digit | Generation collision test | `NOT STARTED` |
| **P7-ACC-03** | Phase 7 | Account lifecycle (Active, Dormant, Frozen) | `com.finserv.modules.account.service` | `accounts.status` | Freeze/unfreeze test | `NOT STARTED` |
| **P8-BEN-01** | Phase 8 | Beneficiary addition with verification status | `com.finserv.modules.beneficiary` | `POST /api/v1/beneficiaries`, `beneficiaries` | Beneficiary validation test | `NOT STARTED` |
| **P8-BEN-02** | Phase 8 | Beneficiary cooling-off enforcement | `com.finserv.modules.beneficiary.service` | `beneficiaries.cooling_off_until` | Cooling-off limit test | `NOT STARTED` |
| **P9-LEDGER-01**| Phase 9 | Double-entry general ledger engine (Balanced debits/credits) | `com.finserv.modules.ledger` | `gl_journal_entries`, `gl_ledger_postings` | Balanced debits/credits test | `NOT STARTED` |
| **P9-TXN-02** | Phase 9 | Pessimistic row locking & balance-after snapshots | `com.finserv.modules.transaction` | `PESSIMISTIC_WRITE`, `accounts`, `transactions` | Concurrent transfer test | `NOT STARTED` |
| **P9-TXN-03** | Phase 9 | Strict idempotency filter `UNIQUE(user_id, key)` | `com.finserv.common.idempotency` | `X-Idempotency-Key`, `idempotency_records` | Replay response test | `NOT STARTED` |
| **P9-TXN-04** | Phase 9 | Cash deposit, teller withdrawal, transfer | `com.finserv.modules.transaction` | `POST /api/v1/transactions/*` | End-to-end transfer test | `NOT STARTED` |
| **P10-STMT-01**| Phase 10 | Paginated transaction ledger search | `com.finserv.modules.statement` | `GET /api/v1/transactions` | Pagination & filter test | `NOT STARTED` |
| **P10-STMT-02**| Phase 10 | Cryptographic digital receipt generation | `com.finserv.modules.statement` | `GET /api/v1/transactions/{id}/receipt` | Receipt hash verification | `NOT STARTED` |
| **P10-STMT-03**| Phase 10 | PDF / CSV statement export | `com.finserv.modules.statement.export` | OpenPDF / Apache POI | Statement generation test | `NOT STARTED` |
| **P11-DASH-01**| Phase 11 | Retail customer banking dashboard UI | `frontend/src/features/dashboard/` | `/api/v1/accounts`, `/api/v1/transactions` | Dashboard render test | `NOT STARTED` |
| **P11-NAV-02** | Phase 11 | Responsive core-banking navigation | `frontend/src/components/layout/` | CSS Grid / Navigation bar | Mobile hamburger test | `NOT STARTED` |
| **P12-PORT-01**| Phase 12 | Branch employee / Teller operations portal | `frontend/src/features/teller/` | `/api/v1/teller/*` | Teller deposit test | `NOT STARTED` |
| **P12-PORT-02**| Phase 12 | Administrator & Back-office portal | `frontend/src/features/admin/` | `/api/v1/admin/*` | Admin role test | `NOT STARTED` |
| **P12-AUD-03** | Phase 12 | Audit operations console (Tamper-evident chain) | `frontend/src/features/audit/` | `/api/v1/audit-logs`, `audit_logs` | Audit query test | `NOT STARTED` |
| **P13-POLISH-01**| Phase 13| UI/UX responsive polish & accessibility (a11y)| `frontend/src/styles/` | WCAG 2.1 AA | Lighthouse / Axe audit | `NOT STARTED` |
| **P14-NOTIF-01**| Phase 14| Multi-channel alert & notification center | `com.finserv.modules.notification` | `notifications`, Webhooks | Notification delivery test | `NOT STARTED` |
| **P14-DISP-02**| Phase 14| Customer support ticket & dispute workflow | `com.finserv.modules.support` | `support_tickets`, `transaction_disputes`| Dispute filing test | `NOT STARTED` |
| **P15-DEP-01** | Phase 15| Fixed Deposit & Recurring Deposit engine | `com.finserv.modules.deposit` | `term_deposits` | Interest calculation test | `NOT STARTED` |
| **P15-DEP-02** | Phase 15| Premature liquidation & penalty deduction | `com.finserv.modules.deposit.service` | `POST /api/v1/deposits/{id}/liquidate` | Liquidation penalty test | `NOT STARTED` |
| **P16-LOAN-01**| Phase 16| Loan product application & underwriting | `com.finserv.modules.loan` | `loan_products`, `loans` | Loan application test | `NOT STARTED` |
| **P16-LOAN-02**| Phase 16| Reducing-balance EMI amortization schedule | `com.finserv.modules.loan.util` | `loan_amortization_schedules` | EMI math verification test | `NOT STARTED` |
| **P16-LOAN-03**| Phase 16| EMI auto-repayment & delinquency tracking | `com.finserv.modules.loan.service` | `loans.outstanding_principal` | Repayment ledger test | `NOT STARTED` |
| **P17-CHQ-01** | Phase 17| Cheque book request & leaf management | `com.finserv.modules.cheque` | `cheque_books`, `cheque_leaves` | Leaf status test | `NOT STARTED` |
| **P17-CHQ-02** | Phase 17| Positive Pay registration & clearing check | `com.finserv.modules.cheque.service` | `positive_pay_records` | Positive Pay match test | `NOT STARTED` |
| **P18-BILL-01**| Phase 18| Utility biller catalog & bill fetch simulation| `com.finserv.modules.billpay` | `billers`, `bill_payments` | Bill fetch mock test | `NOT STARTED` |
| **P18-BILL-02**| Phase 18| Utility bill settlement & auto-pay mandates | `com.finserv.modules.billpay.service` | `POST /api/v1/bills/pay`, `bill_payments` | Bill payment ledger test | `NOT STARTED` |
| **P19-CARD-01**| Phase 19| Virtual/Physical Debit & Credit card issuance (Tokenized) | `com.finserv.modules.card` | `cards` | Card creation test | `NOT STARTED` |
| **P19-CARD-02**| Phase 19| Card security toggles (online/intl/ATM/limits)| `com.finserv.modules.card.service` | `PATCH /api/v1/cards/{id}/controls` | Limit enforcement test | `NOT STARTED` |
| **P19-UPI-03** | Phase 19| UPI VPA registration & instant payment simulator| `com.finserv.modules.upi` | `upi_profiles` | UPI transfer simulation | `NOT STARTED` |
| **P20-INV-01** | Phase 20| Wealth investments & Mutual fund SIP simulator | `com.finserv.modules.investment`| Investment portfolio tables | SIP auto-debit test | `NOT STARTED` |
| **P20-REW-02** | Phase 20| Spend cashback & rewards point redemption | `com.finserv.modules.reward` | Reward accrual tables | Point redemption test | `NOT STARTED` |
| **P21-RISK-01**| Phase 21| Rule-based transaction velocity & fraud checks| `com.finserv.modules.risk` | `risk_assessments` | Velocity rule test | `NOT STARTED` |
| **P21-AML-02** | Phase 21| Anti-Money Laundering alerts & audit console | `com.finserv.modules.risk.service` | `aml_alerts` | SAR escalation test | `NOT STARTED` |
| **P22-INT-01** | Phase 22| Full-stack end-to-end integration & regression | System-wide | Backend + DB + Frontend | Playwright / Newman E2E | `NOT STARTED` |
| **P22-SEC-02** | Phase 22| OWASP security audit & pen-test verification | System-wide | Security headers, JWT, CORS | Security scan verification | `NOT STARTED` |
| **P23-REL-01** | Phase 23| Production release readiness & user guides | `docs/` | Deployment manifests | Deployment rehearsal | `NOT STARTED` |
