package com.finserv.modules.transaction;

import com.finserv.common.exception.ConflictException;
import com.finserv.common.exception.ForbiddenOperationException;
import com.finserv.common.exception.ValidationException;
import com.finserv.modules.account.dto.CreateAccountApplicationRequest;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.account.service.AccountService;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.ledger.entity.GlJournalEntry;
import com.finserv.modules.ledger.entity.GlLedgerPosting;
import com.finserv.modules.ledger.repository.GlJournalEntryRepository;
import com.finserv.modules.ledger.repository.GlLedgerPostingRepository;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.organization.repository.BranchRepository;
import com.finserv.modules.transaction.dto.*;
import com.finserv.modules.transaction.repository.TransactionRepository;
import com.finserv.modules.transaction.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TransactionIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AccountProductRepository accountProductRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private GlJournalEntryRepository glJournalEntryRepository;

    @Autowired
    private GlLedgerPostingRepository glLedgerPostingRepository;

    private User userA;
    private User userB;
    private Account accountA;
    private Account accountB;

    @BeforeEach
    void setUp() {
        userA = new User();
        userA.setUsername("txn_user_a_" + System.currentTimeMillis());
        userA.setEmail("txn_a_" + System.currentTimeMillis() + "@finserv.local");
        userA.setPhoneNumber("+9199" + (long)(Math.random() * 90000000L + 10000000L));
        userA.setPasswordHash("hashed_pass");
        userA.setStatus("ACTIVE");
        userA = userRepository.save(userA);

        userB = new User();
        userB.setUsername("txn_user_b_" + System.currentTimeMillis());
        userB.setEmail("txn_b_" + System.currentTimeMillis() + "@finserv.local");
        userB.setPhoneNumber("+9198" + (long)(Math.random() * 90000000L + 10000000L));
        userB.setPasswordHash("hashed_pass");
        userB.setStatus("ACTIVE");
        userB = userRepository.save(userB);

        AccountProduct savingsProduct = accountProductRepository.findByProductCode("01").orElseThrow();
        Branch branch = branchRepository.findByBranchCode("1001").orElseThrow();

        // Create Account A for User A with initial deposit ₹10,000.00
        CreateAccountApplicationRequest reqA = new CreateAccountApplicationRequest();
        reqA.setProductId(savingsProduct.getId());
        reqA.setBranchId(branch.getId());
        reqA.setInitialDepositAmount(new BigDecimal("10000.00"));
        reqA.setAutoActivate(true);
        reqA.setNickname("Primary Savings");
        var appA = accountService.applyForAccount(userA.getId(), reqA);
        accountA = accountRepository.findById(appA.getCreatedAccountId()).orElseThrow();

        // Create Account B for User B with initial deposit ₹2,000.00
        CreateAccountApplicationRequest reqB = new CreateAccountApplicationRequest();
        reqB.setProductId(savingsProduct.getId());
        reqB.setBranchId(branch.getId());
        reqB.setInitialDepositAmount(new BigDecimal("2000.00"));
        reqB.setAutoActivate(true);
        reqB.setNickname("User B Savings");
        var appB = accountService.applyForAccount(userB.getId(), reqB);
        accountB = accountRepository.findById(appB.getCreatedAccountId()).orElseThrow();
    }

    @Test
    @DisplayName("Should successfully deposit money and generate balanced double-entry GL postings")
    void shouldDepositAndPostBalancedGeneralLedgerEntry() {
        DepositRequest req = new DepositRequest();
        req.setAccountId(accountA.getId());
        req.setAmount(new BigDecimal("5000.00"));
        req.setDescription("Self-service cash deposit");

        String idempKey = "DEP-" + UUID.randomUUID();
        TransactionDto txn = transactionService.deposit(userA.getId(), req, idempKey);

        assertThat(txn).isNotNull();
        assertThat(txn.getTransactionReference()).startsWith("FSV");
        assertThat(txn.getAmount()).isEqualByComparingTo("5000.00");
        assertThat(txn.getToAccountBalanceAfter()).isEqualByComparingTo("15000.00");
        assertThat(txn.getStatus()).isEqualTo("COMPLETED");

        Account refreshed = accountRepository.findById(accountA.getId()).orElseThrow();
        assertThat(refreshed.getCurrentBalance()).isEqualByComparingTo("15000.00");
        assertThat(refreshed.getAvailableBalance()).isEqualByComparingTo("15000.00");

        // Verify balanced double-entry ledger postings
        var entity = transactionRepository.findById(txn.getId()).orElseThrow();
        assertThat(entity.getJournalEntryId()).isNotNull();

        GlJournalEntry journal = glJournalEntryRepository.findById(entity.getJournalEntryId()).orElseThrow();
        assertThat(journal.getTransactionType()).isEqualTo("DEPOSIT");

        List<GlLedgerPosting> postings = glLedgerPostingRepository.findByJournalEntryId(journal.getId());
        assertThat(postings).hasSize(2);

        BigDecimal debits = postings.stream()
                .filter(p -> "DEBIT".equalsIgnoreCase(p.getEntryType()))
                .map(GlLedgerPosting::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal credits = postings.stream()
                .filter(p -> "CREDIT".equalsIgnoreCase(p.getEntryType()))
                .map(GlLedgerPosting::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(debits).isEqualByComparingTo("5000.00");
        assertThat(credits).isEqualByComparingTo("5000.00");
        assertThat(debits).isEqualByComparingTo(credits);
    }

    @Test
    @DisplayName("Should successfully withdraw money and update double-entry ledger")
    void shouldWithdrawAndPostBalancedGeneralLedgerEntry() {
        WithdrawRequest req = new WithdrawRequest();
        req.setAccountId(accountA.getId());
        req.setAmount(new BigDecimal("3000.00"));
        req.setDescription("ATM cash withdrawal");

        String idempKey = "WTH-" + UUID.randomUUID();
        TransactionDto txn = transactionService.withdraw(userA.getId(), req, idempKey);

        assertThat(txn).isNotNull();
        assertThat(txn.getAmount()).isEqualByComparingTo("3000.00");
        assertThat(txn.getFromAccountBalanceAfter()).isEqualByComparingTo("7000.00");

        Account refreshed = accountRepository.findById(accountA.getId()).orElseThrow();
        assertThat(refreshed.getCurrentBalance()).isEqualByComparingTo("7000.00");
        assertThat(refreshed.getAvailableBalance()).isEqualByComparingTo("7000.00");

        var entity = transactionRepository.findById(txn.getId()).orElseThrow();
        List<GlLedgerPosting> postings = glLedgerPostingRepository.findByJournalEntryId(entity.getJournalEntryId());
        assertThat(postings).hasSize(2);

        BigDecimal debits = postings.stream().filter(p -> "DEBIT".equals(p.getEntryType())).map(GlLedgerPosting::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal credits = postings.stream().filter(p -> "CREDIT".equals(p.getEntryType())).map(GlLedgerPosting::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(debits).isEqualByComparingTo(credits);
    }

    @Test
    @DisplayName("Should reject withdrawal when available balance is insufficient with zero mutation")
    void shouldRejectWithdrawalWhenInsufficientBalanceAndNotMutateAccount() {
        WithdrawRequest req = new WithdrawRequest();
        req.setAccountId(accountA.getId());
        req.setAmount(new BigDecimal("25000.00")); // Balance is 10,000.00
        req.setDescription("Overdraft attempt");

        String idempKey = "WTH-FAIL-" + UUID.randomUUID();
        assertThatThrownBy(() -> transactionService.withdraw(userA.getId(), req, idempKey))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Insufficient available balance");

        Account refreshed = accountRepository.findById(accountA.getId()).orElseThrow();
        assertThat(refreshed.getCurrentBalance()).isEqualByComparingTo("10000.00");
        assertThat(refreshed.getAvailableBalance()).isEqualByComparingTo("10000.00");
    }

    @Test
    @DisplayName("Should execute atomic internal transfer between two accounts with balanced GL entries")
    void shouldExecuteInternalTransferAtomicallyBetweenTwoAccounts() {
        TransferRequest req = new TransferRequest();
        req.setFromAccountId(accountA.getId());
        req.setTransferType("DIRECT_ACCOUNT");
        req.setDestinationAccountNumber(accountB.getAccountNumber());
        req.setTransferMode("INTERNAL");
        req.setAmount(new BigDecimal("4000.00"));
        req.setDescription("Direct payment to User B");

        String idempKey = "XFER-" + UUID.randomUUID();
        TransactionDto txn = transactionService.transfer(userA.getId(), req, idempKey);

        assertThat(txn).isNotNull();
        assertThat(txn.getAmount()).isEqualByComparingTo("4000.00");
        assertThat(txn.getTransactionType()).isEqualTo("TRANSFER_INTERNAL");
        assertThat(txn.getFromAccountBalanceAfter()).isEqualByComparingTo("6000.00");
        assertThat(txn.getToAccountBalanceAfter()).isEqualByComparingTo("6000.00");

        Account refreshedA = accountRepository.findById(accountA.getId()).orElseThrow();
        Account refreshedB = accountRepository.findById(accountB.getId()).orElseThrow();

        assertThat(refreshedA.getAvailableBalance()).isEqualByComparingTo("6000.00");
        assertThat(refreshedB.getAvailableBalance()).isEqualByComparingTo("6000.00"); // 2,000 + 4,000

        var entity = transactionRepository.findById(txn.getId()).orElseThrow();
        List<GlLedgerPosting> postings = glLedgerPostingRepository.findByJournalEntryId(entity.getJournalEntryId());
        assertThat(postings).hasSize(2);

        BigDecimal debits = postings.stream().filter(p -> "DEBIT".equals(p.getEntryType())).map(GlLedgerPosting::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal credits = postings.stream().filter(p -> "CREDIT".equals(p.getEntryType())).map(GlLedgerPosting::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(debits).isEqualByComparingTo("4000.00");
        assertThat(credits).isEqualByComparingTo("4000.00");
    }

    @Test
    @DisplayName("Should replay completed transaction on same Idempotency-Key without double-debiting")
    void shouldReplayCompletedTransactionOnSameIdempotencyKeyWithoutDoubleCharging() {
        DepositRequest req = new DepositRequest();
        req.setAccountId(accountA.getId());
        req.setAmount(new BigDecimal("1500.00"));
        req.setDescription("Idempotent deposit test");

        String idempKey = "REPLAY-KEY-" + UUID.randomUUID();
        TransactionDto firstCall = transactionService.deposit(userA.getId(), req, idempKey);

        // Second call with identical payload and key
        TransactionDto secondCall = transactionService.deposit(userA.getId(), req, idempKey);

        assertThat(secondCall.getTransactionReference()).isEqualTo(firstCall.getTransactionReference());
        assertThat(secondCall.getAmount()).isEqualByComparingTo(firstCall.getAmount());

        // Account must have received exactly one deposit of 1500.00 (10000 + 1500 = 11500)
        Account refreshed = accountRepository.findById(accountA.getId()).orElseThrow();
        assertThat(refreshed.getAvailableBalance()).isEqualByComparingTo("11500.00");
    }

    @Test
    @DisplayName("Should reject mismatched payload on reused Idempotency-Key with 409 Conflict")
    void shouldRejectMismatchedPayloadOnSameIdempotencyKeyWithConflict() {
        String idempKey = "CONFLICT-KEY-" + UUID.randomUUID();

        DepositRequest req1 = new DepositRequest(accountA.getId(), new BigDecimal("1000.00"), "First payload");
        transactionService.deposit(userA.getId(), req1, idempKey);

        DepositRequest req2 = new DepositRequest(accountA.getId(), new BigDecimal("2500.00"), "Different payload");
        assertThatThrownBy(() -> transactionService.deposit(userA.getId(), req2, idempKey))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already used with a different request payload");
    }

    @Test
    @DisplayName("Should prevent Customer B from transacting on Customer A's account")
    void shouldPreventCustomerFromTransactingOnAnotherCustomerAccount() {
        WithdrawRequest req = new WithdrawRequest();
        req.setAccountId(accountA.getId()); // Owned by User A
        req.setAmount(new BigDecimal("500.00"));

        String idempKey = "THEFT-ATTEMPT-" + UUID.randomUUID();
        assertThatThrownBy(() -> transactionService.withdraw(userB.getId(), req, idempKey))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("You do not own this account");

        Account refreshedA = accountRepository.findById(accountA.getId()).orElseThrow();
        assertThat(refreshedA.getAvailableBalance()).isEqualByComparingTo("10000.00");
    }

    @Test
    @DisplayName("Should query filtered passbook statement and compute accurate summary KPI metrics")
    void shouldQueryFilteredTransactionsAndComputeAccurateSummaryKpi() {
        // Execute 1 deposit of ₹3,000.00 and 1 withdrawal of ₹1,000.00
        transactionService.deposit(userA.getId(), new DepositRequest(accountA.getId(), new BigDecimal("3000.00"), "Funding"), "DEP-" + UUID.randomUUID());
        transactionService.withdraw(userA.getId(), new WithdrawRequest(accountA.getId(), new BigDecimal("1000.00"), "ATM"), "WTH-" + UUID.randomUUID());

        TransactionPageResponse statement = transactionService.getTransactions(
                userA.getId(), accountA.getId(), "ALL", null, null, null, 0, 20
        );

        assertThat(statement.getItems()).hasSize(2);
        assertThat(statement.getSummary().getTotalCredits()).isEqualByComparingTo("3000.00");
        assertThat(statement.getSummary().getTotalDebits()).isEqualByComparingTo("1000.00");
        assertThat(statement.getSummary().getNetCashflow()).isEqualByComparingTo("2000.00");

        // Receipt verification
        TransactionDto firstTxn = statement.getItems().get(0);
        TransactionReceiptDto receipt = transactionService.getTransactionReceipt(userA.getId(), firstTxn.getId());
        assertThat(receipt).isNotNull();
        assertThat(receipt.getTransactionReference()).isEqualTo(firstTxn.getTransactionReference());
        assertThat(receipt.getJournalReference()).isNotNull();
    }
}
