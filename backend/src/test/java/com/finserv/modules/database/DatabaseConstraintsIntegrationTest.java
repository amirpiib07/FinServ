package com.finserv.modules.database;

import com.finserv.common.util.UuidUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;


import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class DatabaseConstraintsIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @Transactional
    @DisplayName("Should reject negative account balance via chk_accounts_current_nonneg")
    void shouldRejectNegativeAccountBalance() {
        String testCustId = createTestCustomer();
        String accountId = UuidUtils.generateV4().toString();

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO accounts (id, customer_id, branch_id, product_id, account_number, current_balance, available_balance, hold_balance)
                VALUES (?, ?, '00000000-0000-0000-0003-000000001001', '00000000-0000-0000-0002-000000000001', '10010199999991', -100.00, -100.00, 0.00)
                """,
                accountId, testCustId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should reject available_balance != current_balance - hold_balance via chk_accounts_avail_calc")
    void shouldRejectInconsistentAvailableBalance() {
        String testCustId = createTestCustomer();
        String accountId = UuidUtils.generateV4().toString();

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO accounts (id, customer_id, branch_id, product_id, account_number, current_balance, available_balance, hold_balance)
                VALUES (?, ?, '00000000-0000-0000-0003-000000001001', '00000000-0000-0000-0002-000000000001', '10010199999992', 1000.00, 500.00, 200.00)
                """,
                accountId, testCustId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should reject amount <= 0 on account_holds via chk_account_holds_amount")
    void shouldRejectZeroOrNegativeHoldAmount() {
        String testCustId = createTestCustomer();
        String accountId = createTestAccount(testCustId, "10010199999993");

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO account_holds (id, account_id, hold_reference, amount, reason)
                VALUES (?, ?, 'HOLD_NEG_01', 0.00, 'Invalid zero hold')
                """,
                UuidUtils.generateV4().toString(), accountId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should enforce account presence rules on transactions via chk_transactions_account_presence")
    void shouldEnforceTransactionAccountPresence() {
        String testCustId = createTestCustomer();
        String accId = createTestAccount(testCustId, "10010199999994");

        // DEPOSIT must have from_account_id IS NULL and to_account_id IS NOT NULL
        // Testing invalid DEPOSIT with non-null from_account_id
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO transactions (id, transaction_reference, from_account_id, to_account_id, transaction_type, amount)
                VALUES (?, 'TXN_INVALID_DEP', ?, ?, 'DEPOSIT', 500.00)
                """,
                UuidUtils.generateV7().toString(), accId, accId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should enforce UNIQUE(user_id, idempotency_key) on idempotency_records")
    void shouldEnforceUniqueUserIdempotencyKey() {
        String userId = createTestUser("idem_user");
        String key = "IDEM_KEY_123";

        jdbcTemplate.update(
                """
                INSERT INTO idempotency_records (id, idempotency_key, user_id, request_hash, request_path, expires_at)
                VALUES (?, ?, ?, 'HASH1', '/api/v1/test', DATE_ADD(NOW(6), INTERVAL 1 DAY))
                """,
                UuidUtils.generateV4().toString(), key, userId
        );

        // Duplicate insert with same user_id and idempotency_key must fail
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO idempotency_records (id, idempotency_key, user_id, request_hash, request_path, expires_at)
                VALUES (?, ?, ?, 'HASH2', '/api/v1/test', DATE_ADD(NOW(6), INTERVAL 1 DAY))
                """,
                UuidUtils.generateV4().toString(), key, userId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should enforce at most one active onboarding application per user via active_app_marker")
    void shouldEnforceOneActiveApplicationPerUser() {
        String userId = createTestUser("onboard_user");

        jdbcTemplate.update(
                """
                INSERT INTO onboarding_applications (id, user_id, application_reference, status)
                VALUES (?, ?, 'APP_001', 'DRAFT')
                """,
                UuidUtils.generateV4().toString(), userId
        );

        // Second open application (DRAFT, SUBMITTED, UNDER_REVIEW) must fail
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO onboarding_applications (id, user_id, application_reference, status)
                VALUES (?, ?, 'APP_002', 'SUBMITTED')
                """,
                UuidUtils.generateV4().toString(), userId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should enforce maker <> checker on approval_requests via chk_approvals_maker_checker")
    void shouldEnforceMakerCheckerOnApprovalRequests() {
        String userId = createTestUser("maker_user");

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO approval_requests (id, maker_user_id, checker_user_id, entity_type, entity_id, action_type, payload_json)
                VALUES (?, ?, ?, 'TRANSACTION', '123', 'OVERRIDE', '{}')
                """,
                UuidUtils.generateV4().toString(), userId, userId
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should enforce ON DELETE RESTRICT on referenced users")
    void shouldEnforceOnDeleteRestrict() {
        String userId = createTestUser("restrict_user");
        jdbcTemplate.update(
                """
                INSERT INTO onboarding_applications (id, user_id, application_reference, status)
                VALUES (?, ?, 'APP_RESTRICT_01', 'DRAFT')
                """,
                UuidUtils.generateV4().toString(), userId
        );

        // Attempting to delete the referenced user must fail with FK RESTRICT error
        assertThatThrownBy(() -> jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private String createTestUser(String prefix) {
        String userId = UuidUtils.generateV4().toString();
        long ts = System.currentTimeMillis() % 1000000;
        jdbcTemplate.update(
                """
                INSERT INTO users (id, username, email, phone_number, password_hash, status)
                VALUES (?, ?, ?, ?, 'HASH', 'ACTIVE')
                """,
                userId, prefix + "_" + ts, prefix + "_" + ts + "@test.local", "+9198" + ts
        );
        return userId;
    }

    private String createTestCustomer() {
        String userId = createTestUser("cust_user");
        String custId = UuidUtils.generateV4().toString();
        long ts = System.currentTimeMillis() % 1000000;
        jdbcTemplate.update(
                """
                INSERT INTO customers (id, user_id, customer_number, first_name, last_name, date_of_birth, gender, tax_identifier_encrypted, tax_identifier_hash)
                VALUES (?, ?, ?, 'Test', 'Customer', '1990-01-01', 'MALE', 'ENC', ?)
                """,
                custId, userId, "2026" + String.format("%07d", ts) + "1", "HASH_" + ts
        );
        return custId;
    }

    private String createTestAccount(String customerId, String accountNumber) {
        String accountId = UuidUtils.generateV4().toString();
        jdbcTemplate.update(
                """
                INSERT INTO accounts (id, customer_id, branch_id, product_id, account_number, current_balance, available_balance, hold_balance)
                VALUES (?, ?, '00000000-0000-0000-0003-000000001001', '00000000-0000-0000-0002-000000000001', ?, 5000.00, 5000.00, 0.00)
                """,
                accountId, customerId, accountNumber
        );
        return accountId;
    }
}
