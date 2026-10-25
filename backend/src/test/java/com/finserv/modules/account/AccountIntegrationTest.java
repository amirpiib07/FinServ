package com.finserv.modules.account;

import com.finserv.modules.account.dto.AccountApplicationDto;
import com.finserv.modules.account.dto.AccountDto;
import com.finserv.modules.account.dto.CreateAccountApplicationRequest;
import com.finserv.modules.account.dto.UpdateAccountControlsRequest;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.service.AccountService;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.organization.repository.BranchRepository;
import com.finserv.modules.sequence.generator.AccountNumberGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
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
class AccountIntegrationTest {

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccountProductRepository accountProductRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUserA;
    private User testUserB;
    private AccountProduct savingsProduct;
    private Branch headOfficeBranch;

    @BeforeEach
    void setUp() {

        testUserA = new User();
        testUserA.setUsername("cust_a_" + System.currentTimeMillis());
        testUserA.setEmail("cust_a_" + System.currentTimeMillis() + "@finserv.local");
        testUserA.setPhoneNumber("+9199" + (long)(Math.random() * 90000000L + 10000000L));
        testUserA.setPasswordHash("hashed_pass");
        testUserA.setStatus("ACTIVE");
        testUserA = userRepository.save(testUserA);

        testUserB = new User();
        testUserB.setUsername("cust_b_" + System.currentTimeMillis());
        testUserB.setEmail("cust_b_" + System.currentTimeMillis() + "@finserv.local");
        testUserB.setPhoneNumber("+9198" + (long)(Math.random() * 90000000L + 10000000L));
        testUserB.setPasswordHash("hashed_pass");
        testUserB.setStatus("ACTIVE");
        testUserB = userRepository.save(testUserB);

        savingsProduct = accountProductRepository.findByProductCode("01").orElseThrow();
        headOfficeBranch = branchRepository.findByBranchCode("1001").orElseThrow();
    }

    @Test
    @DisplayName("Should successfully auto-activate retail savings account with valid 14-digit ISO 7064 account number")
    void shouldAutoActivateAccountWithValidCheckDigit() {
        CreateAccountApplicationRequest req = new CreateAccountApplicationRequest();
        req.setProductId(savingsProduct.getId());
        req.setBranchId(headOfficeBranch.getId());
        req.setInitialDepositAmount(new BigDecimal("2500.00"));
        req.setNickname("Primary Savings");
        req.setAutoActivate(true);

        AccountApplicationDto application = accountService.applyForAccount(testUserA.getId(), req);

        assertThat(application).isNotNull();
        assertThat(application.getApplicationStatus()).isEqualTo("APPROVED");
        assertThat(application.getCreatedAccountId()).isNotNull();

        List<AccountDto> accounts = accountService.getCustomerAccounts(testUserA.getId());
        assertThat(accounts).hasSize(1);

        AccountDto acc = accounts.get(0);
        assertThat(acc.getId()).isEqualTo(application.getCreatedAccountId());
        assertThat(acc.getAccountNumber()).hasSize(14);
        assertThat(AccountNumberGenerator.validate(acc.getAccountNumber())).isTrue();
        assertThat(acc.getCurrentBalance()).isEqualByComparingTo("2500.00");
        assertThat(acc.getAvailableBalance()).isEqualByComparingTo("2500.00");
        assertThat(acc.getHoldBalance()).isEqualByComparingTo("0.00");
        assertThat(acc.getNickname()).isEqualTo("Primary Savings");
        assertThat(acc.getMaskedAccountNumber()).startsWith("••••••••••");
    }

    @Test
    @DisplayName("Should enforce strict ownership authorization: Customer A cannot view Customer B's account")
    void shouldEnforceStrictAccountOwnership() {
        // Customer A opens account
        CreateAccountApplicationRequest req = new CreateAccountApplicationRequest();
        req.setProductId(savingsProduct.getId());
        req.setBranchId(headOfficeBranch.getId());
        req.setInitialDepositAmount(new BigDecimal("1000.00"));
        req.setAutoActivate(true);

        AccountApplicationDto appA = accountService.applyForAccount(testUserA.getId(), req);
        UUID accountIdA = appA.getCreatedAccountId();

        // Customer A can view own account
        AccountDto myAcc = accountService.getAccountById(accountIdA, testUserA.getId(), false);
        assertThat(myAcc).isNotNull();

        // Customer B attempting to view Customer A's account must throw AccessDeniedException
        assertThatThrownBy(() -> accountService.getAccountById(accountIdA, testUserB.getId(), false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("authorization");

        // Staff/Admin can view Customer A's account
        AccountDto staffView = accountService.getAccountById(accountIdA, testUserB.getId(), true);
        assertThat(staffView).isNotNull();
        assertThat(staffView.getId()).isEqualTo(accountIdA);
    }

    @Test
    @DisplayName("Should allow customer to update account controls (nickname)")
    void shouldUpdateAccountControls() {
        CreateAccountApplicationRequest req = new CreateAccountApplicationRequest();
        req.setProductId(savingsProduct.getId());
        req.setBranchId(headOfficeBranch.getId());
        req.setInitialDepositAmount(new BigDecimal("500.00"));
        req.setAutoActivate(true);

        AccountApplicationDto app = accountService.applyForAccount(testUserA.getId(), req);

        UpdateAccountControlsRequest updateReq = new UpdateAccountControlsRequest("Vacation Savings Fund", "MONTHLY_EMAIL");
        AccountDto updated = accountService.updateAccountControls(app.getCreatedAccountId(), testUserA.getId(), updateReq);

        assertThat(updated.getNickname()).isEqualTo("Vacation Savings Fund");
    }

    @Test
    @DisplayName("Should default initial deposit to 5000.00 INR when unspecified or zero on account opening")
    void shouldDefaultInitialDepositTo5000WhenUnspecified() {
        CreateAccountApplicationRequest req = new CreateAccountApplicationRequest();
        req.setProductId(savingsProduct.getId());
        req.setBranchId(headOfficeBranch.getId());
        req.setInitialDepositAmount(null);
        req.setAutoActivate(true);

        AccountApplicationDto application = accountService.applyForAccount(testUserA.getId(), req);

        assertThat(application).isNotNull();
        assertThat(application.getApplicationStatus()).isEqualTo("APPROVED");
        assertThat(application.getCreatedAccountId()).isNotNull();

        AccountDto acc = accountService.getAccountById(application.getCreatedAccountId(), testUserA.getId(), false);
        assertThat(acc.getCurrentBalance()).isEqualByComparingTo("5000.00");
        assertThat(acc.getAvailableBalance()).isEqualByComparingTo("5000.00");
    }
}

