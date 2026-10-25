# FinServ Database

The FinServ database is the MySQL database layer for the **FinServ Banking Management System**.

It is designed to support a secure, scalable and transaction-safe banking platform with customer management, KYC, bank accounts, beneficiaries, financial transactions, audit logging and role-based access control.

---

## 1. Database Technology

| Component | Technology |
|---|---|
| Database | MySQL |
| Database Name | `finserv` |
| Database Client | MySQL Workbench |
| Development SQL Client | VS Code + SQLTools |
| Backend | Java + Spring Boot |
| ORM | JPA / Hibernate |
| API | REST |
| Currency | INR |

---

# 2. Database Architecture

The current database is divided into the following logical areas:

### Identity & Security
- Users
- Roles
- User-role mapping

### Customer Management
- Customers
- Customer addresses

### Branch & Employee Management
- Branches
- Employees

### KYC Management
- KYC
- KYC documents
- KYC verification history

### Account Management
- Account types
- Accounts
- Account holders
- Account status history
- Account nominees

### Beneficiary Management
- Beneficiaries
- Beneficiary status history

### Transaction & Ledger
- Transactions
- Transaction entries

### Audit
- Audit logs

---

# 3. Current Database Tables

The current version contains **20 core tables**.

| # | Table | Purpose |
|---|---|---|
| 1 | `users` | Stores login and account-security information |
| 2 | `roles` | Stores application roles |
| 3 | `user_roles` | Maps users to roles |
| 4 | `customers` | Stores customer profiles |
| 5 | `customer_addresses` | Stores customer addresses |
| 6 | `branches` | Stores bank branch information |
| 7 | `employees` | Stores bank employee information |
| 8 | `kyc` | Stores customer KYC status |
| 9 | `kyc_documents` | Stores KYC document information |
| 10 | `kyc_verification_history` | Tracks KYC status changes |
| 11 | `account_types` | Defines bank account types |
| 12 | `accounts` | Stores bank account information and balances |
| 13 | `account_holders` | Maps customers to accounts |
| 14 | `account_status_history` | Tracks account status changes |
| 15 | `account_nominees` | Stores account nominee information |
| 16 | `beneficiaries` | Stores customer beneficiaries |
| 17 | `beneficiary_status_history` | Tracks beneficiary status changes |
| 18 | `transactions` | Stores financial transaction information |
| 19 | `transaction_entries` | Stores debit/credit ledger entries |
| 20 | `audit_logs` | Stores system activity and audit information |

---

# 4. SQL Script Execution Order

The SQL files are intentionally numbered to represent the recommended execution order.

```text
01_create_database.sql
        ↓
02_tables.sql
        ↓
03_constraints.sql
        ↓
04_indexes.sql
        ↓
05_views.sql
        ↓
06_triggers.sql
        ↓
07_procedures.sql
        ↓
08_functions.sql
        ↓
09_sample_data.sql
        ↓
10_test_queries.sql