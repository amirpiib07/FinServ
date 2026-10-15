package com.finserv.modules.database;

import com.finserv.common.util.UuidUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class DatabaseConstraintsIntegrationTest {

    private static final AtomicInteger SEQ = new AtomicInteger(1000);

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
        )).isInstanceOf(DataAccessException.class);
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
        )).isInstanceOf(DataAccessException.class);
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
        )).isInstanceOf(DataAccessException.class);
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
        )).isInstanceOf(DataAccessException.class);
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
        )).isInstanceOf(DataAccessException.class);
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
        )).isInstanceOf(DataAccessException.class);
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
        )).isInstanceOf(DataAccessException.class);
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
                .isInstanceOf(DataAccessException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should reject approved onboarding application without verifier via chk_onboarding_maker_checker")
    void shouldRejectApprovedWithoutVerifierOnOnboarding() {
        String userId = createTestUser("verifier_test_user");
        String approverId = createTestUser("approver_user");

        // Attempt to insert an APPROVED onboarding application with approved_by_user_id set, but verified_by_user_id NULL
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO onboarding_applications (id, user_id, application_reference, status, approved_by_user_id, approved_at)
                VALUES (?, ?, 'APP_NO_VERIFIER_01', 'APPROVED', ?, NOW(6))
                """,
                UuidUtils.generateV4().toString(), userId, approverId
        )).isInstanceOf(DataAccessException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should enforce UNIQUE reversal reference on transactions via uq_transactions_reversal")
    void shouldEnforceUniqueReversalReferenceOnTransactions() {
        String testCustId = createTestCustomer();
        String accId = createTestAccount(testCustId, "10010199999995");

        String originalTxnId = UuidUtils.generateV7().toString();
        jdbcTemplate.update(
                """
                INSERT INTO transactions (id, transaction_reference, from_account_id, to_account_id, transaction_type, amount, status)
                VALUES (?, 'TXN_ORIG_01', NULL, ?, 'DEPOSIT', 100.00, 'COMPLETED')
                """,
                originalTxnId, accId
        );

        String firstReversalId = UuidUtils.generateV7().toString();
        jdbcTemplate.update(
                """
                INSERT INTO transactions (id, transaction_reference, from_account_id, to_account_id, transaction_type, amount, status, reversal_of_transaction_id)
                VALUES (?, 'TXN_REV_01', ?, NULL, 'REVERSAL', 100.00, 'COMPLETED', ?)
                """,
                firstReversalId, accId, originalTxnId
        );

        // Second reversal referencing the same original transaction must fail
        String secondReversalId = UuidUtils.generateV7().toString();
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO transactions (id, transaction_reference, from_account_id, to_account_id, transaction_type, amount, status, reversal_of_transaction_id)
                VALUES (?, 'TXN_REV_02', ?, NULL, 'REVERSAL', 100.00, 'COMPLETED', ?)
                """,
                secondReversalId, accId, originalTxnId
        )).isInstanceOf(DataAccessException.class);
    }

    @Test
    @Transactional
    @DisplayName("Should allow new DRAFT onboarding application when previous application is in terminal REJECTED status")
    void shouldAllowNewApplicationAfterTerminalStatus() {
        String userId = createTestUser("terminal_app_user");

        jdbcTemplate.update(
                """
                INSERT INTO onboarding_applications (id, user_id, application_reference, status)
                VALUES (?, ?, 'APP_TERM_01', 'REJECTED')
                """,
                UuidUtils.generateV4().toString(), userId
        );

        // New DRAFT application for same user must succeed because REJECTED sets active_app_marker to NULL
        int rows = jdbcTemplate.update(
                """
                INSERT INTO onboarding_applications (id, user_id, application_reference, status)
                VALUES (?, ?, 'APP_TERM_02', 'DRAFT')
                """,
                UuidUtils.generateV4().toString(), userId
        );
        org.assertj.core.api.Assertions.assertThat(rows).isEqualTo(1);
    }

    private String createTestUser(String prefix) {
        String userId = UuidUtils.generateV4().toString();
        int seq = SEQ.incrementAndGet();
        String uniqueSuffix = seq + "_" + UUID.randomUUID().toString().substring(0, 6);
        jdbcTemplate.update(
                """
                INSERT INTO users (id, username, email, phone_number, password_hash, status)
                VALUES (?, ?, ?, ?, 'HASH', 'ACTIVE')
                """,
                userId, prefix + "_" + uniqueSuffix, prefix + "_" + uniqueSuffix + "@test.local", String.format("+9198%08d", seq % 100000000)
        );
        return userId;
    }

    private String createTestCustomer() {
        String userId = createTestUser("cust_user");
        String custId = UuidUtils.generateV4().toString();
        int seq = SEQ.incrementAndGet();
        jdbcTemplate.update(
                """
                INSERT INTO customers (id, user_id, customer_number, first_name, last_name, date_of_birth, gender, tax_identifier_encrypted, tax_identifier_hash)
                VALUES (?, ?, ?, 'Test', 'Customer', '1990-01-01', 'MALE', 'ENC', ?)
                """,
                custId, userId, "2026" + String.format("%07d", seq % 10000000) + "1", "HASH_" + seq + "_" + UUID.randomUUID()
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
