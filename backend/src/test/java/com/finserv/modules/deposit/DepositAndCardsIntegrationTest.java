package com.finserv.modules.deposit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finserv.common.util.UuidUtils;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.card.dto.UpdateCardControlsRequest;
import com.finserv.modules.card.entity.VirtualCard;
import com.finserv.modules.card.repository.VirtualCardRepository;
import com.finserv.modules.deposit.dto.BookFixedDepositRequest;
import com.finserv.modules.deposit.entity.FixedDeposit;
import com.finserv.modules.deposit.repository.FixedDepositRepository;
import com.finserv.modules.identity.dto.AuthResponse;
import com.finserv.modules.identity.dto.RegisterRequest;
import com.finserv.modules.ledger.repository.GlJournalEntryRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.organization.repository.BranchRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DepositAndCardsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerLookupService customerLookupService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AccountProductRepository accountProductRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private FixedDepositRepository fixedDepositRepository;

    @Autowired
    private VirtualCardRepository virtualCardRepository;

    @Autowired
    private GlJournalEntryRepository glJournalEntryRepository;

    private record UserSession(UUID userId, String token, Customer customer, Account account) {}

    private UserSession createCustomerWithFundedAccount(String username, BigDecimal initialBalance) throws Exception {
        RegisterRequest register = new RegisterRequest(
                username,
                username + "@finserv.com",
                "+91" + String.format("%010d", System.currentTimeMillis() % 10000000000L),
                "StrongP@ss123!"
        );

        MvcResult regRes = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(regRes.getResponse().getContentAsString(), AuthResponse.class);
        UUID userId = auth.getUser().getId();
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);

        Branch branch = branchRepository.findByBranchCode("1001").orElseThrow();
        AccountProduct product = accountProductRepository.findByProductCode("01").orElseThrow();

        Account account = new Account();
        account.setId(UuidUtils.generateV7());
        account.setCustomerId(customer.getId());
        account.setBranchId(branch.getId());
        account.setProductId(product.getId());
        account.setAccountNumber("100101" + String.format("%08d", Math.abs(UUID.randomUUID().hashCode() % 100000000)));
        account.setCurrency("INR");
        account.setCurrentBalance(initialBalance.setScale(2, RoundingMode.HALF_UP));
        account.setAvailableBalance(initialBalance.setScale(2, RoundingMode.HALF_UP));
        account.setHoldBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        account.setStatus("ACTIVE");
        account.setOpenedAt(Instant.now());
        Account savedAccount = accountRepository.save(account);

        return new UserSession(userId, auth.getAccessToken(), customer, savedAccount);
    }

    @Test
    @DisplayName("Should fetch all standard Fixed Deposit tenure rate slabs")
    void testFetchFdRateSlabs() throws Exception {
        mockMvc.perform(get("/api/v1/deposits/rates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].tenureMonths").value(6))
                .andExpect(jsonPath("$[0].interestRatePercentage").value(6.50))
                .andExpect(jsonPath("$[1].tenureMonths").value(12))
                .andExpect(jsonPath("$[1].interestRatePercentage").value(7.25));
    }

    @Test
    @DisplayName("Should successfully book Fixed Deposit, debit account balance, and post balanced GL journal")
    void testBookFixedDepositSuccessful() throws Exception {
        UserSession session = createCustomerWithFundedAccount("fd.saver", new BigDecimal("50000.00"));
        BigDecimal principal = new BigDecimal("20000.00");
        int tenureMonths = 12;

        BookFixedDepositRequest request = new BookFixedDepositRequest(
                session.account().getId(),
                principal,
                tenureMonths
        );

        long glCountBefore = glJournalEntryRepository.count();

        mockMvc.perform(post("/api/v1/deposits")
                        .header("Authorization", "Bearer " + session.token())
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.depositNumber").exists())
                .andExpect(jsonPath("$.principalAmount").value(20000.00))
                .andExpect(jsonPath("$.interestRatePercentage").value(7.25))
                .andExpect(jsonPath("$.tenureMonths").value(12))
                .andExpect(jsonPath("$.interestEarned").value(1450.00))
                .andExpect(jsonPath("$.maturityAmount").value(21450.00))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // 1. Verify source account balance deducted
        Account updatedAccount = accountRepository.findById(session.account().getId()).orElseThrow();
        assertThat(updatedAccount.getCurrentBalance()).isEqualByComparingTo(new BigDecimal("30000.00"));
        assertThat(updatedAccount.getAvailableBalance()).isEqualByComparingTo(new BigDecimal("30000.00"));

        // 2. Verify FD stored in DB
        var deposits = fixedDepositRepository.findByCustomerIdOrderByCreatedAtDesc(session.customer().getId());
        assertThat(deposits).hasSize(1);
        FixedDeposit fd = deposits.getFirst();
        assertThat(fd.getPrincipalAmount()).isEqualByComparingTo(principal);
        assertThat(fd.getMaturityAmount()).isEqualByComparingTo(new BigDecimal("21450.00"));

        // 3. Verify double-entry GL journal posted
        assertThat(glJournalEntryRepository.count()).isEqualTo(glCountBefore + 1);

        // 4. Verify customer listing endpoint returns the booked FD
        mockMvc.perform(get("/api/v1/deposits")
                        .header("Authorization", "Bearer " + session.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].depositNumber").value(fd.getDepositNumber()));
    }

    @Test
    @DisplayName("Should reject Fixed Deposit booking when available balance is insufficient")
    void testBookFixedDepositInsufficientFunds() throws Exception {
        UserSession session = createCustomerWithFundedAccount("low.balance.user", new BigDecimal("5000.00"));
        BigDecimal principal = new BigDecimal("25000.00"); // exceeds 5,000

        BookFixedDepositRequest request = new BookFixedDepositRequest(
                session.account().getId(),
                principal,
                12
        );

        mockMvc.perform(post("/api/v1/deposits")
                        .header("Authorization", "Bearer " + session.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        // Verify account balance was NOT modified
        Account account = accountRepository.findById(session.account().getId()).orElseThrow();
        assertThat(account.getCurrentBalance()).isEqualByComparingTo(new BigDecimal("5000.00"));
    }

    @Test
    @DisplayName("Should auto-provision virtual debit card and allow customer to update channel controls and spend limit")
    void testVirtualCardProvisionAndControlsUpdate() throws Exception {
        UserSession session = createCustomerWithFundedAccount("card.holder", new BigDecimal("10000.00"));

        // 1. Fetch cards (auto-provisions linked platinum debit card)
        mockMvc.perform(get("/api/v1/cards")
                        .header("Authorization", "Bearer " + session.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[0].cardNetwork").value("VISA"))
                .andExpect(jsonPath("$[0].onlineTransactionsEnabled").value(true))
                .andExpect(jsonPath("$[0].dailySpendLimit").value(50000.00));

        var cards = virtualCardRepository.findByCustomerIdOrderByCreatedAtDesc(session.customer().getId());
        assertThat(cards).hasSize(1);
        VirtualCard card = cards.getFirst();

        // 2. Freeze card and adjust limits
        UpdateCardControlsRequest updateReq = new UpdateCardControlsRequest(
                "FROZEN",
                false,
                true,
                true,
                new BigDecimal("75000.00")
        );

        mockMvc.perform(patch("/api/v1/cards/" + card.getId() + "/controls")
                        .header("Authorization", "Bearer " + session.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FROZEN"))
                .andExpect(jsonPath("$.onlineTransactionsEnabled").value(false))
                .andExpect(jsonPath("$.internationalEnabled").value(true))
                .andExpect(jsonPath("$.dailySpendLimit").value(75000.00));

        VirtualCard updatedInDb = virtualCardRepository.findById(card.getId()).orElseThrow();
        assertThat(updatedInDb.getStatus()).isEqualTo("FROZEN");
        assertThat(updatedInDb.isOnlineTransactionsEnabled()).isFalse();
        assertThat(updatedInDb.isInternationalEnabled()).isTrue();
        assertThat(updatedInDb.getDailySpendLimit()).isEqualByComparingTo(new BigDecimal("75000.00"));
    }
}
