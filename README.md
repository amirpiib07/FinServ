# FinServ Lite

A small banking system built to **show what MySQL can do**. The Java part is a plain console
application (JDBC, no frameworks); almost all the logic lives in the database as stored
procedures, functions, triggers, views and events.

| | |
|---|---|
| Database | MySQL 8.0.31 or later (needs `CHECK`, CTEs, window functions, `INTERSECT`/`EXCEPT`) |
| Java | 17 or later, Maven |
| Tables | 8 (branches, customers, account_types, accounts, transactions, loans, loan_payments, audit_log) |
| Routines | 7 functions, 15 procedures, 12 triggers, 3 events, 6 views |

## Folder layout

```text
finserv-lite/
├── sql/                         14 scripts, run in numeric order (run_all.sh does it for you)
├── src/main/java/com/finserv/   28 Java classes (config, model, dao, service, ui, util, exception)
├── src/main/resources/          db.properties.example
├── docs/
│   ├── UML_class_diagram.pdf/.png   class diagram of the Java app
│   ├── ER_diagram.pdf/.png          database diagram
│   └── tools/                       scripts that regenerate both diagrams from the code and the database
├── pom.xml
└── README.md
```

## Quick start

```bash
# 1. Build the database (asks for the MySQL root password)
cd sql && ./run_all.sh -u root -p

# 2. Tell the app how to connect
cp src/main/resources/db.properties.example src/main/resources/db.properties   # then edit it
#    or set FINSERV_DB_URL, FINSERV_DB_USER, FINSERV_DB_PASSWORD

# 3. Run the console app
mvn compile exec:java
```

The app user needs `SELECT` on the views, `EXECUTE` on the procedures and `SELECT` on the tables it
reads. `sql/13_security_dcl.sql` creates ready-made roles (`bank_teller`, `bank_auditor`, `bank_admin`)
and users for this; change their example passwords first.

## The SQL scripts

| # | Script | What it shows |
|---|---|---|
| 01 | `01_schema.sql` | `CREATE DATABASE/TABLE`, data types (INT, DECIMAL, ENUM, JSON, DATE, TIMESTAMP), PK, FK, UNIQUE, CHECK, DEFAULT, generated columns, descending index |
| 02 | `02_alter_and_indexes.sql` | `ALTER TABLE` (add / modify / rename / drop column, add constraint), composite, FULLTEXT, functional and invisible indexes, `RENAME`, `TRUNCATE`, temporary tables |
| 03 | `03_functions.sql` | Stored functions (EMI formula, masking, age, balance), `DETERMINISTIC` / `READS SQL DATA` / `NO SQL`, `CASE`, `IF` |
| 04 | `04_views.sql` | Join, aggregate, derived-table and window-function views, updatable view `WITH CHECK OPTION` |
| 05 | `05_procedures.sql` | `IN` / `OUT` / `INOUT`, `IF`, `REPEAT`, `LOOP`, cursor, handlers, `SIGNAL` / `RESIGNAL`, `START TRANSACTION` / `COMMIT` / `ROLLBACK`, `SELECT ... FOR UPDATE`, `PREPARE` / `EXECUTE` |
| 06 | `06_triggers.sql` | `BEFORE` / `AFTER` x `INSERT` / `UPDATE` / `DELETE`, `OLD` / `NEW`, `SIGNAL`, JSON audit snapshots, append-only ledger |
| 07 | `07_events.sql` | Event Scheduler: monthly interest, daily dormancy check, weekly audit purge |
| 08 | `08_sample_data.sql` | Multi-row `INSERT`, `INSERT IGNORE`, `ON DUPLICATE KEY UPDATE`, `REPLACE`, `INSERT ... SELECT`, `UPDATE`, `DELETE` with subquery, `JSON_SET` |
| 09 | `09_seed_activity.sql` | `CALL` with `OUT` variables; `SET timestamp` to create six months of history |
| 10 | `10_queries_basic.sql` | Filtering, `GROUP BY` / `HAVING` / `ROLLUP`, string, number, date, `NULL` and JSON functions, `REGEXP`, FULLTEXT, calling routines |
| 11 | `11_queries_advanced.sql` | All join types, subqueries (`IN`, `EXISTS`, `ANY`, `ALL`, correlated), `UNION` / `INTERSECT` / `EXCEPT`, CTEs, recursive CTEs, window functions, `LATERAL`, `JSON_TABLE`, pivot, `GROUPING()` |
| 12 | `12_transactions_tcl.sql` | `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `autocommit`, isolation levels, `FOR SHARE` / `NOWAIT` / `SKIP LOCKED`, `LOCK TABLES`, `GET DIAGNOSTICS` |
| 13 | `13_security_dcl.sql` | `CREATE USER`, roles, `GRANT` / `REVOKE` at database, column and routine level, password policy, resource limits |
| 14 | `14_admin_and_explain.sql` | `EXPLAIN` / `EXPLAIN ANALYZE`, index hints, `SHOW`, `INFORMATION_SCHEMA`, `ANALYZE TABLE`, backup commands |

## How the money rules work

* `sp_post_entry` is the **only** code that changes a balance. It locks the account row
  (`FOR UPDATE`), checks status and minimum balance, updates the balance and writes one ledger row.
* `sp_deposit`, `sp_withdraw`, `sp_transfer`, `sp_open_account`, `sp_approve_loan`, `sp_pay_emi` and
  `sp_apply_interest` each open the transaction, call `sp_post_entry`, and `COMMIT`. Any error rolls
  everything back and is re-raised to the caller.
* `sp_transfer` locks the lower account id first, so two opposite transfers cannot deadlock.
* The ledger (`transactions`) cannot be updated or deleted: triggers refuse both.
* Triggers write the audit trail; the Java code never writes to `audit_log`.

## Java layers

`ui` (menus) calls `service` (input checks) calls `dao` (all SQL) which returns `model` records.
Every DAO extends `BaseDao`, which opens connections from the `DatabaseConfig` singleton and turns
`SQLException` into `BankException`. Messages written with `SIGNAL` in the SQL scripts reach the
user unchanged. See `docs/UML_class_diagram.pdf`.

## Good to know

* `transactions.txn_time` is always supplied by the procedure (`NOW()`). A stored generated column
  (`txn_date`) cannot be computed from a `DEFAULT CURRENT_TIMESTAMP` value, so a plain insert that
  relies on the default fails with "Incorrect date value".
* `07_events.sql` runs `SET GLOBAL event_scheduler = ON`, which needs an administrator account.
* `09_seed_activity.sql` uses `SET @@session.timestamp`, so the sample data covers April to
  September 2026 whatever the real date is; the script resets the clock at the end.
* The scripts drop and recreate the `finserv_lite` database. Do not run them on a database you care about.

## Regenerating the diagrams

```bash
mvn compile
python3 docs/tools/uml_from_classes.py target/classes docs/UML_class_diagram   # needs JDK + Graphviz
python3 docs/tools/er_from_mysql.py docs/ER_diagram -u root -p                 # needs mysql client + Graphviz
```
