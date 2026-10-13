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

- **Java**: OpenJDK / Oracle JDK 21+ (Environment has JDK 26.0.1)
- **Maven**: 3.9+ (Environment has Maven 3.10.0)
- **Node.js**: v20+ (Environment has v24.20.0)
- **MySQL**: 8.0+ (Environment has MySQL 8.0.46 Community Server)
- **Git**: 2.x (Environment has Git 2.54.0)

### Configuration

1. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Configure your local MySQL database connection details in `backend/.env`.

---

## 📜 Development Status

Development progresses strictly through phased milestone iterations (Phase 0 through Phase 23). Detailed tracking is maintained in [docs/PROGRESS.md](file:///c:/Users/AMIT%20KUMAR%20SINGH/OneDrive/Desktop/finserv/docs/PROGRESS.md) and [docs/TRACEABILITY.md](file:///c:/Users/AMIT%20KUMAR%20SINGH/OneDrive/Desktop/finserv/docs/TRACEABILITY.md).
