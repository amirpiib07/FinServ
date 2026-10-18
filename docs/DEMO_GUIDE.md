# FINServ — 5-Minute End-to-End Evaluation & Demo Guide

Welcome to **FINServ**, an enterprise Banking Management System engineered with strict financial controls, double-entry general ledger accounting, SHA-256 audit hash chains, and luxury responsive UX.

This guide provides an evaluator or judge with a swift, comprehensive 5-minute walkthrough of the entire banking lifecycle.

---

## ⚡ Pre-Demo Quick Start

### 1. Start the Backend API (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
- **Health Check**: `http://localhost:8080/actuator/health` (Returns `{"status":"UP"}`)
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`

### 2. Start the Frontend Client (React 19 + TypeScript + Vite)
```bash
cd frontend
npm run dev
```
- **Application URL**: `http://localhost:5173/login`

---

## 🔑 Demo Personas & Credentials

| Persona | Username | Password | Default Landing | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `amit.kumar.singh` | `AdminMasterP@ss1!` | `/admin/dashboard` | Chief Technology & Operations Officer. Provisioning, branches, staff, GL trial balance, SHA-256 audit logs. |
| **Bank Officer / Admin** | `officer.mumbai` | `OfficerSecureP@ss1!` | `/admin/dashboard` | Senior Credit & Branch Manager. KYC review workbench, account opening decisions, account freeze/unfreeze. |
| **Verified Customer** | `alex.kumar` | `AlexSecureP@ss1!` | `/app/dashboard` | Existing active retail customer with active accounts, virtual cards, beneficiaries, and transaction history. |

---

## ⏱️ Step-by-Step 5-Minute Evaluation Journey

### Step 1: Customer Registration & Progressive KYC Onboarding (60 Seconds)

1. Open `http://localhost:5173/login`.
2. Click **"Open an Account"** or navigate to `/register`.
3. Fill in the Customer Registration form:
   - **Full Name**: `Priya Sharma`
   - **Email**: `priya.sharma@example.com`
   - **Phone**: `9876543210`
   - **Username**: `priya.sharma`
   - **Password**: `PriyaSecureP@ss1!`
   - Click **Create Account**.
4. You are immediately redirected into the **5-Step Progressive KYC Wizard** (`/app/onboarding`):
   - **Step 1: Contact Verification**: Enter simulated OTP `123456` (displayed in developer hint) and click **Verify & Continue**.
   - **Step 2: Profile & Identity**: Date of Birth, Gender, Mother's Name, Father's Name, Occupation. Click **Next Step**.
   - **Step 3: Addresses**: Permanent and Communication addresses. Pincode autofills City & State. Click **Next Step**.
   - **Step 4: Declarations & KYC**: Enter PAN `ABCDE1234F` (stored with blind-index HMAC-SHA256 and AES-256-GCM encryption), Aadhaar last 4 digits `9012`, PEP declaration, Tax residency declaration. Click **Next Step**.
   - **Step 5: Review & Submit**: Inspect your complete application summary, accept Terms & Conditions, and click **Submit Application**.
5. The UI displays the live **KYC Verification Tracker** with status badge `PENDING_REVIEW` and estimated SLA countdown. Notice that attempting to bypass to `/app/dashboard` safely keeps you on the tracker until authorized!

---

### Step 2: Maker-Checker KYC Approval by Bank Officer (45 Seconds)

1. Click the top-right user menu and select **Logout**.
2. Log in as Bank Officer:
   - **Username**: `officer.mumbai`
   - **Password**: `OfficerSecureP@ss1!`
3. You are placed in the **Admin Operations Command Center** (`/admin/dashboard`).
4. Click **KYC Review Workbench** (`/admin/kyc`) in the sidebar:
   - Notice `Priya Sharma` is at the top of the **Pending KYC Applications Queue**.
   - Click **Review Application** to open the rich modal inspecting the encrypted documents, addresses, and declarations.
   - Enter Maker-Checker Officer Notes: `"Aadhaar and PAN verified against regulatory sandbox. Customer approved."`
   - Click **Approve Customer KYC**.
5. The queue updates instantly. Customer status is now `VERIFIED`, and a permanent, cryptographically linked record is recorded in `audit_logs`!

---

### Step 3: Account Application & Approval (45 Seconds)

1. Log out from the Admin portal and log back in as customer `priya.sharma` (`PriyaSecureP@ss1!`).
2. Notice the Onboarding Tracker now displays a celebratory green checkmark: **"KYC Approved & Verified"**!
3. Click **Proceed to Core Banking** to enter the Customer Portal.
4. Navigate to **Accounts** (`/app/accounts`) and click **Open New Account**:
   - **Product**: `FinServ Executive Savings`
   - **Branch**: `BOM-001 (Mumbai Nariman Point)`
   - **Initial Deposit Commitment**: `₹10,000`
   - Click **Submit Application**.
5. Notice the alert card displaying your **Pending Account Opening Application**.
6. Switch back to Bank Officer (`officer.mumbai`) or Super Admin (`amit.kumar.singh`):
   - Navigate to `/admin/accounts` -> **Pending Applications** tab.
   - Click **Approve Application**.
   - The backend runs the collision-free **ISO 7064 Mod 11,10** account number generator (e.g. `10010100064010`) and creates the customer account record under a pessimistic sequence lock!

---

### Step 4: Ledger-Backed Direct Deposit & IMPS Transfer (60 Seconds)

1. Log in as customer `alex.kumar` (`AlexSecureP@ss1!`) who has established accounts and balances.
2. Navigate to **Transfers & Payments** (`/app/transfers`):
   - Click the **Instant Deposit** tab.
   - Select your primary account.
   - Enter Amount: `₹25,000`.
   - Remarks: `"Salary Credit / Consulting Retainer"`.
   - Click **Execute Deposit**.
   - Confirm in the summary modal: **Celebratory wealth SVG animation** plays upon backend confirmation.
3. Switch to the **Single Transfer (IMPS/NEFT/Internal)** tab:
   - Funding Account: `10010100064010`
   - Transfer Mode: `Internal FinServ Transfer` or `IMPS 24x7`
   - Destination Account / Payee: Select existing beneficiary `Rohan Verma`
   - Amount: `₹5,000`
   - Click **Review & Transfer** and confirm.
   - Backend acquires row locks in ascending order (`PESSIMISTIC_WRITE`), verifies zero negative balance, debits source account, credits destination, posts balanced double-entry GL journal entries (`Debits == Credits`), and returns the confirmation.
4. Click **View Transaction Receipt**: A luxury, printable formal PDF-style **Transaction Advice Advice** appears with UTR and timestamp.

---

### Step 5: Fixed Deposits Module (FD Calculator & Booking) (45 Seconds)

1. Navigate to **Fixed Deposits** (`/app/deposits`) in the customer sidebar:
2. **Interactive FD Maturity Calculator**:
   - Adjust the **Principal Amount Slider** to `₹1,00,000`.
   - Toggle the tenure pills: `6 Months (6.50%)`, `1 Year (7.25%)`, `2 Years (7.50%)`, `3 Years (7.75%)`.
   - Watch the live, animated visual breakdown recalculate:
     - **Principal Invested**: `₹1,00,000`
     - **Guaranteed Interest**: `₹7,250`
     - **Maturity Amount**: `₹1,07,250` (`BigDecimal` compound calculation)
     - **Maturity Date**: Exactly 12 months ahead formatted in Asia/Kolkata time.
3. Click **Book Fixed Deposit Now**:
   - Select your funded Savings Account.
   - Review the legally binding Term Deposit summary.
   - Click **Confirm & Book FD**.
   - The backend debits the account, transfers balance to the Term Deposit GL liability account, creates the FD record, and triggers the wealth-growth success animation.
4. In the **Active Fixed Deposits Portfolio**, view your new FD card with its maturity progress bar, certificate number, and click **View Certificate** to open and print your official **Deposit Certificate Advice**!

---

### Step 6: Virtual Platinum Debit Card Controls & Kill Switch (30 Seconds)

1. Navigate to **Virtual Cards** (`/app/cards`) in the customer sidebar:
2. Behold the **Interactive 3D Metallic FinServ Platinum Card**:
   - Obsidian, emerald, and gold gradient graphic with gold EMV chip SVG, contactless wave icon, and embossed cardholder name `ALEX KUMAR`.
   - Click **Reveal Mask** to reveal masked digits.
   - Click **Copy Number** to copy the tokenized card number with feedback toast.
3. Test the **Instant Security Controls**:
   - Click **Freeze Card**: The card instantly animates with an icy blue frosted-glass lock overlay and badge shifts to `FROZEN`. The kill switch is persisted in the database!
   - Click **Unfreeze Card**: Card returns to active gold/obsidian luster.
   - Toggle channel switches: **Online & E-Commerce**, **Tap & Pay Contactless**, **International Usage**.
   - Drag the **Daily Spend Limit** slider to `₹1,50,000` and click **Save Daily Limit**.
   - All actions create real-time entries in `audit_logs`.

---

### Step 7: Super Admin Double-Entry GL Balance & SHA-256 Audit Trail (30 Seconds)

1. Log out and log in as Super Admin:
   - **Username**: `amit.kumar.singh`
   - **Password**: `AdminMasterP@ss1!`
2. Navigate to **GL Ledger & Audit Trail** (`/admin/audit-ledger`):
   - **Double-Entry General Ledger Balance**:
     - Inspect the live Trial Balance KPI card.
     - Verify: **Total Debits = Total Credits** ($\Delta = \text{₹0.00}$).
     - The **Balanced Ledger Invariant** badge shows a bold green `BALANCED`.
   - **SHA-256 Cryptographic Audit Trail**:
     - Inspect the audit log table.
     - View the chronological chain with User IDs, Actions (`CREATE`, `UPDATE`, `APPROVE`), and SHA-256 hashes linking each entry to the previous block.
3. Navigate to **Branches & Staff** (`/admin/branches-staff`):
   - Inspect existing branches (`Mumbai Nariman Point`, `Bengaluru Indiranagar`).
   - Create a new branch with unique IFSC code or provision a new Bank Officer account.

---

## 🛡️ Architecture & Financial Safety Guarantees Verified

1. **Zero Fake Balances**: Every rupee displayed on the screen originates from real database transactions and balances.
2. **Double-Entry GL Invariant**: Every transfer, deposit, withdrawal, and FD booking creates balanced debit and credit entries in `gl_ledger_postings`.
3. **Pessimistic Concurrency**: Simultaneous transfers acquire deterministic ascending row locks (`PESSIMISTIC_WRITE`), preventing double-spend and deadlocks.
4. **Strict Idempotency**: All mutating operations carry unique UUID `Idempotency-Key` headers; repeated submissions return identical cached responses without double charges.
5. **Zero Float/Double**: All currency math uses `java.math.BigDecimal` (backend) and `decimal.js` (frontend) with Banker's Rounding (`ROUND_HALF_EVEN`).
6. **No Raw Secrets**: CVVs and plain PINs are never stored; passwords use BCrypt; sensitive PII uses AES-256-GCM; audit logs form a SHA-256 tamper-evident hash chain.
