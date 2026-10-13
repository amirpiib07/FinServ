# FINServ — Master Requirements Specification

## 1. Executive Summary & Purpose

FINServ is an enterprise-grade Core Banking and Digital Financial Services Platform built from the ground up to support modern retail and commercial banking operations. The system adheres to strict financial safety standards, zero-loss accounting integrity (double-entry general ledger), zero trust security principles, and compliant customer lifecycle management.

---

## 2. Stakeholders and Actor Personas

| Role | Description | Access Scope |
| :--- | :--- | :--- |
| **Retail Customer** | Individual bank account holder | Self-service web portal: account overview, transfers, beneficiaries, cards, bills, deposits, loans, statements |
| **Branch Teller / Staff** | Frontline bank branch employee | Cash deposits, cash withdrawals, cheque clearing, KYC verification step-1, account verification |
| **Branch Manager** | Branch supervisor & approver | High-value transaction overrides, loan sanction approvals, staff account actions, branch reporting |
| **Back-Office Operations** | Central operations specialist | Batch settlements, reconciliation exceptions, dispute handling, biller settlement |
| **Compliance & AML Officer**| Risk, Fraud, and Audit specialist | Flagged transactions, freeze accounts, audit trails, regulatory reporting, SAR (Suspicious Activity Reports) |
| **System Administrator** | Platform administrator | User roles, branch management, fee schedules, product catalogs, system configurations |

---

## 3. Functional Requirements by Module

### Module 1: Authentication, Access Control & Session Security (Phases 4, 12)
- **FR-AUTH-01**: Secure registration with bcrypt-hashed credentials (cost factor >= 12).
- **FR-AUTH-02**: Stateless JSON Web Token (JWT) issuance with dual-token architecture: short-lived Access Token (15-60 min) and rotating Refresh Token (7 days).
- **FR-AUTH-03**: Role-Based Access Control (RBAC) supporting hierarchical roles (`ROLE_CUSTOMER`, `ROLE_EMPLOYEE`, `ROLE_MANAGER`, `ROLE_ADMIN`, `ROLE_COMPLIANCE`).
- **FR-AUTH-04**: Account lockout protection after 5 consecutive failed login attempts with progressive cool-off (15 minutes).
- **FR-AUTH-05**: Force password rotation, password strength evaluation, and blacklist check for compromised passwords.
- **FR-AUTH-06**: Session revocation & logout across single or all active devices.

### Module 2: Progressive Customer Onboarding & KYC (Phase 5)
- **FR-KYC-01**: Multi-step progressive registration flow:
  1. *Step 1: Credentials & Primary Contact*: Email, mobile number, password.
  2. *Step 2: Contact Verification*: Two-factor OTP verification for mobile & email.
  3. *Step 3: Identity & Demographics*: Full legal name, DOB, gender, marital status, nationality.
  4. *Step 4: Address & Tax Declaration*: Residential address, permanent address, tax ID (PAN / SSN), FATCA declaration.
  5. *Step 5: KYC Document Upload*: Government ID (Aadhaar, Passport, Voter ID) and proof of address with mime-type and virus scanning validation.
  6. *Step 6: Review & Application Submission*: Complete summary confirmation with e-declaration.
- **FR-KYC-02**: KYC state machine: `INITIATED` -> `DOCUMENTS_PENDING` -> `SUBMITTED` -> `UNDER_REVIEW` -> `VERIFIED` / `REJECTED` / `RE_UPLOAD_REQUESTED`.
- **FR-KYC-03**: Tiered KYC levels (Tier 1: Basic with transaction cap; Tier 2: Full KYC with standard limits; Tier 3: High net worth).

### Module 3: Customer, Branch & Employee Management (Phases 6, 12)
- **FR-CRM-01**: Customer 360 View: Single unified record linking customer identity, addresses, active accounts, KYC status, cards, loans, and audit trail.
- **FR-CRM-02**: Branch Hierarchy: Multi-branch support with unique IFSC / Branch routing codes, branch manager assignment, operational hours, and contact information.
- **FR-CRM-03**: Employee Directory: Staff onboarding, branch assignment, role binding, and department scoping.

### Module 4: Account Applications, Opening & Management (Phase 7)
- **FR-ACC-01**: Product Catalog: Savings Account, Current/Checking Account, Salary Account, Student Account.
- **FR-ACC-02**: Account Number Generation: Cryptographically non-sequential, check-digit verified 12-to-16 digit account numbers.
- **FR-ACC-03**: Account Lifecycle: `APPLICATION_PENDING` -> `ACTIVE` -> `DORMANT` (after 180 days inactivity) -> `FROZEN` (regulatory/compliance) -> `CLOSED`.
- **FR-ACC-04**: Balance Tracking: Available Balance, Ledger Balance, and Hold Balance (earmarked funds).
- **FR-ACC-05**: Minimum Balance & Fee Rules: Automated evaluation of minimum balance thresholds and penalty assessments.

### Module 5: Beneficiary Management (Phase 8)
- **FR-BEN-01**: Beneficiary types: Intra-bank (FINServ to FINServ), Inter-bank (NEFT/RTGS/IMPS), and UPI VPA.
- **FR-BEN-02**: Cooling-off period: Configurable cooling-off window (default 30 minutes) post-addition where transfer limit is capped (e.g., max ₹50,000 / $500).
- **FR-BEN-03**: OTP verification requirement before beneficiary activation.
- **FR-BEN-04**: Payee validation: Name matching check and IFSC branch validation.

### Module 6: Core Ledger, Financial Transactions & Safety (Phase 9)
- **FR-TXN-01**: Double-Entry General Ledger: Every transaction creates at least two immutable `journal_entries` (one debit, one credit) that must balance to zero (`Σ Debits == Σ Credits`).
- **FR-TXN-02**: Transaction Types: Cash Deposit, Teller Withdrawal, ATM Withdrawal, Account-to-Account Transfer, Fee Assessment, Interest Credit, Reversal.
- **FR-TXN-03**: Concurrency & Locking: Explicit row-level locking (`SELECT ... FOR UPDATE` via `PESSIMISTIC_WRITE`) on participating accounts within atomic database transactions (`@Transactional(isolation = Isolation.READ_COMMITTED)`).
- **FR-TXN-04**: Strict Idempotency: All financial mutations must supply an `X-Idempotency-Key`. Duplicate keys within 24 hours return the cached response without re-executing.
- **FR-TXN-05**: High-Precision Arithmetic: All balances and monetary amounts stored as `DECIMAL(15,2)` or `DECIMAL(19,4)`. Floating point math is strictly forbidden.
- **FR-TXN-06**: Explicit Reversals: Transactions cannot be modified or deleted. Errors require explicit reversal transactions (`reversal_of_transaction_id`) with audit explanations.

### Module 7: Statements, Transaction History & Receipts (Phase 10)
- **FR-STMT-01**: Paginated transaction ledger with multi-attribute filtering (date range, transaction type, amount range, reference ID).
- **FR-STMT-02**: Export formats: PDF statement generation with bank branding and CSV download.
- **FR-STMT-03**: Single-transaction digital receipt: Cryptographically hashed reference ID, downloadable and printable.

### Module 8: Customer & Staff Portals (Phases 11, 12, 13)
- **FR-PORT-01**: Customer Dashboard: Account balance widgets, quick transfers, recent activity feed, card quick-actions, spending insights.
- **FR-PORT-02**: Teller Operations Portal: Fast cash deposit/withdrawal interface, physical token/slip entry, cheque presentation.
- **FR-PORT-03**: Admin & Manager Console: User management, branch overrides, ledger reconciliation dashboard, system parameters configuration.
- **FR-PORT-04**: Audit Operations Console: Real-time search across immutable audit logs, staff action history, and compliance event monitors.

### Module 9: Notifications, Support & Disputes (Phase 14)
- **FR-NOTIF-01**: Multi-channel alerts (In-App notifications, simulated Email/SMS webhooks) for all debits, credits, login attempts, and password changes.
- **FR-SUPP-01**: Ticketing system: Customer dispute submission, category assignment, SLA tracking, staff response threads.
- **FR-DISP-01**: Transaction chargeback/dispute lifecycle: `FILED` -> `INVESTIGATING` -> `PROVISIONAL_CREDIT` -> `RESOLVED_CUSTOMER` / `RESOLVED_MERCHANT`.

### Module 10: Fixed & Recurring Deposits (Phase 15)
- **FR-DEP-01**: Fixed Deposit (FD): Flexible tenures (7 days to 10 years), compounding frequencies (monthly, quarterly, at maturity), maturity payout instructions.
- **FR-DEP-02**: Recurring Deposit (RD): Monthly installment auto-debit, penalty for missed installments, maturity payout.
- **FR-DEP-03**: Premature Liquidation: Penalty interest rate reduction calculation and immediate credit to linked savings account.

### Module 11: Loans, Credit & EMI Repayment Engine (Phase 16)
- **FR-LOAN-01**: Loan Products: Personal Loan, Home Loan, Vehicle Loan, Education Loan.
- **FR-LOAN-02**: Amortization Calculation: Equal Monthly Installment (EMI) generation using standard reducing-balance actuarial formula.
- **FR-LOAN-03**: Repayment Processing: Automated due-date collection from primary account, split into Principal and Interest components.
- **FR-LOAN-04**: Loan Default & Delinquency: Overdue interest penalties, NPA (Non-Performing Asset) classification after 90 days delinquent.
- **FR-LOAN-05**: Foreclosure & Pre-payment: Outstanding principal calculation, prepayment fees, and loan closure certificates.

### Module 12: Cheque Operations & Clearing (Phase 17)
- **FR-CHQ-01**: Cheque Book Issuance: Request 25/50 leaf cheque books, tracking dispatch, activation upon delivery.
- **FR-CHQ-02**: Cheque Status Lifecycle: `ISSUED` -> `PRESENTED` -> `CLEARED` / `BOUNCED_INSUFFICIENT_FUNDS` / `STOPPED`.
- **FR-CHQ-03**: Positive Pay System: Pre-registration of high-value cheques (drawer account, cheque number, amount, payee name) before presentation.
- **FR-CHQ-04**: Stop Payment: Immediate leaf or leaf-range stop payment order with fee deduction.

### Module 13: Bill Payments & Utility Recharges (Phase 18)
- **FR-BILL-01**: Biller Categories: Electricity, Water, Piped Gas, Mobile Postpaid/Prepaid, Broadband, Fastag.
- **FR-BILL-02**: Bill Fetch & Instant Pay: External biller simulation (BBPS-style), auto-fetch of overdue amounts, instant settlement.
- **FR-BILL-03**: Auto-pay Mandates: Standing instructions for recurring utility bills with maximum limit caps.

### Module 14: Cards & Instant UPI Payments (Phase 19)
- **FR-CARD-01**: Debit & Credit Card Management: Virtual card issuance, physical card request, CVV security reveal (time-limited), PIN setting.
- **FR-CARD-02**: Card Controls: Toggle online e-commerce, international usage, contactless NFC, ATM withdrawals, and set per-transaction / daily spending limits.
- **FR-UPI-01**: UPI VPA creation (e.g., `user@finserv`), QR code generation, peer-to-peer instant transfers, merchant collect requests.

### Module 15: Investments, Insurance & Rewards (Phase 20)
- **FR-INV-01**: Wealth Portfolio: Mutual fund SIP simulator, fixed return sovereign gold bonds, and recurring investment portfolios.
- **FR-INS-02**: Bancassurance: Term life insurance and health insurance enrollment and premium auto-deduction.
- **FR-REW-03**: Loyalty Rewards Engine: Spend-based point accrual, milestone cashbacks, and point redemption against service fees.

### Module 16: Fraud Detection, Risk Controls & Regulatory Compliance (Phase 21)
- **FR-RISK-01**: Rule-Based Fraud Detection: Velocity checks (e.g., >3 transfers in 5 minutes), high-value thresholds, anomalous IP/device changes.
- **FR-RISK-02**: Risk Scoring: Transaction risk score assignment (LOW, MEDIUM, HIGH, CRITICAL).
- **FR-RISK-03**: Anti-Money Laundering (AML): High-value cash transaction alerts (PMLA / FinCEN thresholds), automated suspicious transaction flagging.
- **FR-RISK-04**: Complete Audit Trail: Immutable logging of all administrative actions, balance overrides, KYC reviews, and security alterations.

---

## 4. Non-Functional Requirements (NFR)

- **NFR-SEC-01 (Security)**: All endpoints under `/api/v1/**` (except `/api/v1/auth/**` and public health) require valid Bearer JWT. Passwords hashed using BCrypt.
- **NFR-PERF-02 (Performance)**: Core transfer API latency P95 < 250ms under normal load. Database queries indexed for sub-50ms execution.
- **NFR-REL-03 (Reliability & Consistency)**: Zero balance drift. Double-entry ledger integrity verified by periodic scheduled automated reconciliation.
- **NFR-AUD-04 (Auditability)**: Complete append-only audit trail with UTC timestamp, actor ID, IP address, user agent, old value, new value, and correlation ID.
- **NFR-ACC-05 (Accessibility & Usability)**: Web UI conforms to WCAG 2.1 AA standards; keyboard navigable, responsive down to 360px viewport, semantic HTML, dark/light modes.
