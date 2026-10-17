# FINServ — Enterprise Core Banking Management System

FINServ is a production-grade, enterprise Banking Management System engineered with strict financial controls, double-entry ledger consistency, multi-layered security, and progressive customer journeys.

---

## 🏛️ System Architecture Overview

- **Backend**: Java 21 / 26 SE Runtime, Spring Boot 3.x, Spring Security (Stateless JWT + RBAC), Spring Data JPA / Hibernate
- **Database**: MySQL 8.0 with Flyway schema migration versioning
- **Frontend**: React 19 + TypeScript, Vite build tool, Vanilla CSS custom design system (Tokens, Glassmorphism, Responsive CSS Grid/Flexbox)
- **API Standard**: RESTful JSON API, OpenAPI 3.0 (Swagger UI), RFC 7807 Problem Details for HTTP APIs
- **Financial Safety**: Double-entry ledger accounting, Pessimistic row-level locking (`PESSIMISTIC_WRITE`), Idempotency keys, Audit logging, Decimal precision (`DECIMAL(19,4)` and `DECIMAL(15,2)`)

---

## 📂 Repository Structure

```
FINSERV/
├── backend/                  # Spring Boot REST API
│   ├── .env.example          # Environment variable template (fake credentials)
│   └── src/                  # (Phase 1+)
├── frontend/                 # React + TypeScript + Vite Client
│   └── src/                  # (Phase 2+)
├── database/                 # Database scripts & Flyway migrations
│   ├── migrations/           # Versioned Flyway DDL scripts (V1__..., V2__...)
│   └── seeds/                # Idempotent dev seeds
├── docs/                     # System specifications & tracking
│   ├── brand/                # Brand guidelines & official logos
│   │   ├── README.md
│   │   └── logo_placeholder.svg
│   ├── PROGRESS.md           # Phase status, architectural decisions, run logs
│   ├── TRACEABILITY.md       # Master requirement-to-test traceability matrix
│   ├── REQUIREMENTS.md       # Full functional & non-functional requirements
│   ├── ARCHITECTURE.md       # Layering, API standards, security, error handling
│   ├── DATABASE_DESIGN.md    # Complete relational schema, Mermaid ERD, ledger model
│   └── RISKS_AND_DEPENDENCIES.md # Risk register and external integration dependencies
└── README.md                 # Project root documentation
```

---

## 🛡️ Non-Negotiable Financial Safety Principles

1. **Double-Entry General Ledger**: Every monetary movement creates balanced, immutable debit and credit journal entries. Account balances are verifiable derived views of ledger state.
2. **Never Use Floating-Point for Currency**: All monetary amounts are stored as `DECIMAL(15,2)` or `DECIMAL(19,4)` to prevent IEEE 754 precision loss.
3. **Strict Idempotency**: All mutating operations (transfers, deposits, withdrawals, card payments) require unique `X-Idempotency-Key` headers with persistent replay caching.
4. **Row-Level Locking**: Concurrent operations on account balances utilize pessimistic write locking (`SELECT ... FOR UPDATE`) within ACID transaction boundaries.
5. **No Secrets in Git**: Database credentials, JWT secrets, and API keys are read from environment variables only (`backend/.env`).

---

## 🚀 Getting Started

### Prerequisites

- **Java**: OpenJDK / Oracle JDK 21+ (Environment has JDK 26.0.1; bytecode compiled with `--release 21`)
- **Maven**: 3.9+ (Environment has Apache Maven 3.10.0)
- **Node.js**: v20+ (Environment has v24.20.0)
- **MySQL**: 8.0+ (Environment has MySQL 8.0.46 Community Server)
- **Git**: 2.x (Environment has Git 2.54.0)

---

### Database Initialization & Permissions Setup

1. **Verify or Configure MySQL Timezone & Trigger Permissions**:
   The FINServ schema enforces strict UTC timestamps (`DATETIME(6)`) and database triggers.
   In MySQL (`my.ini` or via MySQL client as root):
   ```sql
   SET GLOBAL time_zone = '+00:00';
   SET GLOBAL log_bin_trust_function_creators = 1;
   ```
   To make the timezone persistent across service restarts, add the following under `[mysqld]` in your MySQL configuration file (`my.ini`):
   ```ini
   default-time-zone = '+00:00'
   ```

2. **Execute Admin Setup Script**:
   Open `database/admin/01_init_users_and_permissions.sql`. Replace the password placeholders (`${FINSERV_MIGRATION_PASSWORD}` and `${FINSERV_APP_PASSWORD}`) with secure passwords, then run it against your MySQL instance as `root`:
   ```bash
   mysql -u root -p < database/admin/01_init_users_and_permissions.sql
   ```
   This script creates:
   - Database `finserv_db` (Core application database, UTF-8 MB4 Unicode)
   - Database `finserv_test_db` (Isolated scratch database for automated integration tests)
   - User `finserv_migration` (DDL, triggers, references, schema migrations)
   - User `finserv_app` (Runtime restricted DML: SELECT, INSERT, UPDATE, with explicit DELETE only on `idempotency_records` and `otp_challenges`)

3. **Configure Environment Variables (`backend/.env`)**:
   Copy `backend/.env.example` to `backend/.env` and update the credentials matching what you configured in Step 2:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Example `backend/.env`:
   ```ini
   SERVER_PORT=8080
   SPRING_PROFILES_ACTIVE=dev

   DB_URL=jdbc:mysql://localhost:3306/finserv_db?useSSL=false&serverTimezone=UTC&connectionTimeZone=UTC&allowPublicKeyRetrieval=true
   DB_MIGRATION_USERNAME=finserv_migration
   DB_MIGRATION_PASSWORD=<your_migration_password>
   DB_USERNAME=finserv_app
   DB_PASSWORD=<your_app_password>

   APP_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   ADMIN_USERNAME=superadmin
   ADMIN_PASSWORD=<your_admin_password>
   ADMIN_EMAIL=admin@finserv.local
   ```

---

### Building and Running the Backend

1. **Run All Automated Tests**:
   Automated integration tests target the isolated `finserv_test_db` scratch database and will never touch `finserv_db`:
   ```bash
   cd backend
   mvn test
   ```
   To run unit tests independently without database connectivity:
   ```bash
   mvn test -Dtest="*UnitTest,*GeneratorTest,*EncryptionServiceTest,*ExceptionHandlerTest"
   ```

2. **Build Runnable JAR**:
   ```bash
   cd backend
   mvn clean package -DskipTests
   ```

3. **Start the Application (Dev Profile)**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   Flyway will automatically apply ordered migrations `V1_1` through `V1_8` and seed reference data `V2` against `finserv_db`.
   Hibernate validates the schema against the JPA entity definitions (`spring.jpa.hibernate.ddl-auto=validate`).

4. **Verify Health & API Documentation**:
   - Actuator Health Check: `GET http://localhost:8080/actuator/health` (Returns `{"status":"UP"}`)
   - Swagger UI: `http://localhost:8080/swagger-ui.html`
   - OpenAPI v3 Docs: `http://localhost:8080/v3/api-docs`

---

### Building and Running the Frontend

1. **Environment Setup (`frontend/.env`)**:
   ```bash
   cd frontend
   cp .env.example .env
   ```
   Default `VITE_API_BASE_URL=/api/v1` routes through the Vite proxy to `http://localhost:8080`.

2. **Run Lint, Type-Check & Unit/A11y Tests**:
   ```bash
   npm run lint        # ESLint 9 checks
   npm run typecheck   # TypeScript strict checks (noUncheckedIndexedAccess)
   npm test            # 110 Vitest unit, component, and accessibility tests
   ```

3. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   - Authentication: `http://localhost:5173/login`
   - Core Banking Layout: `http://localhost:5173/app/accounts`
   - Transfer Studio: `http://localhost:5173/app/transfers`
   - Digital Passbook & Statements: `http://localhost:5173/app/statements`
   - Living Design System: `http://localhost:5173/design-system` (Dev-only, live Actuator probe)

4. **Production Build**:
   ```bash
   npm run build
   ```
   Compiles clean production assets to `frontend/dist/`. Dev-only design system routes and components are statically dead-code eliminated from the bundle.

---

## 📜 Development Status

Development progresses strictly through phased milestone iterations following the consolidated 7-Phase Master Roadmap:
- **Phase 0**: Architecture & Database Design (`COMPLETED`)
- **Phase 1**: Backend Foundation & MySQL Flyway Setup (`COMPLETED`)
- **Phase 2**: Frontend Foundation & UI Component Kit (`COMPLETED`)
- **Phase 3**: Branding, Auth (JWT/Sessions) & Progressive Customer Onboarding + KYC (`COMPLETED`)
- **Phase 4**: Accounts (Applications, Opening, Details) & Beneficiary Management (`COMPLETED`)
- **Phase 5**: Money Transfers, Deposits/Withdrawals, Double-Entry Ledger & Statements/Receipts (`COMPLETED`)
- **Phase 6**: Customer Dashboard + Employee/Admin Portal (KYC/Account Approvals & Audit Logs) (`NOT STARTED`)
- **Phase 7**: Core Add-ons (FD/Cards Overview), UI/Motion Polish, End-to-End QA & Final Docs (`NOT STARTED`)

Detailed tracking is maintained in [docs/PROGRESS.md](file:///c:/Users/AMIT%20KUMAR%20SINGH/OneDrive/Desktop/finserv/docs/PROGRESS.md) and [docs/TRACEABILITY.md](file:///c:/Users/AMIT%20KUMAR%20SINGH/OneDrive/Desktop/finserv/docs/TRACEABILITY.md).
