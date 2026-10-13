# FINServ — External Dependencies & Risk Register

## 1. External Dependencies Architecture

FINServ distinguishes clearly between **autonomous core banking functionality** (which executes fully and reliably on the local platform) and **external enterprise payment/government integrations** (which require real-world banking charters, licensed switches, and commercial API contracts).

### 1.1 Working Local Implementations vs. External Dependencies

| Subsystem / Capability | Working Local / Autonomous Implementation | Real Production External Dependency | Dependency Classification |
| :--- | :--- | :--- | :--- |
| **Intra-Bank Transfers** | Native double-entry general ledger engine, row-level locking, atomic ACID database commits. | None. Fully self-contained within FINServ. | `INTERNAL_CORE` |
| **Contact OTP Verification** | Cryptographically secure 6-digit TOTP generator with 5-minute TTL stored in memory/DB; printed to mock notification log in dev. | Telecom SMS Gateway (Twilio / Gupshup / Infobip / Sinch) & SMTP Mail Server (SendGrid / SES). | `EXTERNAL_GATEWAY` |
| **Customer KYC & ID Verification** | Multi-step progressive document upload with mime-type validation, file storage, and teller verification console. | UIDAI Aadhaar e-KYC, DigiLocker, NSDL PAN verification API, Passport Seva API. | `GOVERNMENT_API` |
| **Inter-Bank Transfers (NEFT / RTGS / IMPS)** | Complete internal debit/hold flow with simulated Clearing House response (NPCI / RBI settlement queues). | National Payments Corporation of India (NPCI) IMPS Switch / RBI NEFT & RTGS Gateway. | `BANKING_CLEARING_HOUSE` |
| **Instant UPI Payments** | Full VPA namespace manager (`user@finserv`), QR code encoder, peer-to-peer ledger settlement, collect request flow. | NPCI UPI Common Library (CL), UPI Central Switch, Bank PSP integration. | `PAYMENT_NETWORK` |
| **Card Issuance & Controls** | Luhn-valid virtual card generation, tokenized storage, CVV hashing, online/international control toggles. | Card Payment Networks (Visa / Mastercard / RuPay), Card Personalization Bureau (plastic embossing). | `CARD_NETWORK_PROCESSOR` |
| **Utility Bill Payments** | Multi-category biller catalog (Electricity, Water, Fastag, Telecom), bill fetch simulator, instant debit and receipting. | Bharat Bill Payment System (BBPS) / BillDesk / NPCI Bharat BillPay switch. | `BILLER_AGGREGATOR` |
| **Credit Scoring & Underwriting** | Rules-based underwriting algorithm evaluating customer account age, monthly turnover, and average balance. | Credit Information Bureaus (CIBIL / Experian / Equifax / CRIF High Mark). | `CREDIT_BUREAU` |

---

## 2. Technical, Financial & Security Risk Register

| Risk ID | Category | Risk Description | Likelihood | Impact | Severity | Mitigation Strategy & Controls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-FIN-01** | Financial Safety | **Concurrent Double-Spending & Race Conditions**: Simultaneous transfer requests draining account below permitted balance. | Medium | Critical | **HIGH** | Explicit row-level locking (`SELECT ... FOR UPDATE` via `PESSIMISTIC_WRITE`) with accounts locked in deterministic ascending ID order to prevent deadlocks; isolation level `READ_COMMITTED`. |
| **RSK-FIN-02** | Financial Safety | **Duplicate Transaction Submissions**: User clicking "Send" repeatedly or network retry storm creating duplicate debits. | High | Critical | **CRITICAL** | Mandatory `X-Idempotency-Key` header verified against `idempotency_records` table with SHA-256 payload fingerprinting and 24-hour replay cache. |
| **RSK-ACC-03** | Accounting Integrity | **General Ledger Imbalance**: System bug or partial database failure causing debits to mismatch credits. | Low | Critical | **CRITICAL** | Atomic transaction boundaries wrapping both debit and credit entries; double-entry invariant verification trigger; scheduled daily reconciliation background job. |
| **RSK-MATH-04**| Data Integrity | **Floating-Point Rounding Drift**: IEEE 754 precision loss accumulating fractional cents/paise over millions of calculations. | High | High | **HIGH** | Strict ban on `float` and `double`. All database columns use `DECIMAL(15,2)` or `DECIMAL(19,4)`. Java code exclusively uses `BigDecimal` with `RoundingMode.HALF_EVEN`. |
| **RSK-SEC-05** | Security & Auth | **Unauthorized Resource Tampering (IDOR)**: Authenticated customer tampering with URL parameters to debit or view another user's account. | High | Critical | **CRITICAL** | Server-side customer ownership checks in domain services; verified matching of `UserPrincipal.getId()` to `account.getCustomer().getUserId()`. |
| **RSK-SEC-06** | Security & PII | **Credential & Secret Exposure in Git/Logs**: Database credentials or plain-text PII appearing in source control or application logs. | Medium | High | **HIGH** | All credentials loaded strictly from `backend/.env` (excluded by `.gitignore`); passwords hashed with BCrypt (cost 12); PII (PAN, CVV, Card numbers) masked in logs. |
| **RSK-KYC-07** | Compliance | **Premature Account Activation**: A newly registered user opening accounts or transferring funds before official KYC review. | Medium | Critical | **CRITICAL** | Strict KYC state machine: `INITIATED` -> `DOCUMENTS_PENDING` -> `UNDER_REVIEW` -> `VERIFIED`. Account opening is physically blocked until state is verified by staff. |
| **RSK-OPS-08** | Availability | **Database Lock Contention & Starvation**: High volume of transactions on a single hot account causing database lock timeouts. | Low | Medium | **MEDIUM** | Transaction duration kept strictly minimal (<50ms under lock); batch processing of interest and fees scheduled during off-peak windows; query index optimization. |
