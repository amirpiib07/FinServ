package com.finserv.modules.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.identity.dto.AuthResponse;
import com.finserv.modules.identity.dto.RegisterRequest;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.repository.CustomerRepository;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.organization.repository.BranchRepository;
import com.finserv.modules.transaction.dto.DepositRequest;
import com.finserv.modules.transaction.service.TransactionService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CustomerDashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerLookupService customerLookupService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AccountProductRepository accountProductRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private TransactionService transactionService;

    private record UserAuth(User user, Customer customer, String token) {}

    private UserAuth setupVerifiedCustomer() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest req = new RegisterRequest(
                "dash_cust_" + suffix,
                "dash_" + suffix + "@finserv.local",
                "+9197" + (10000000 + (int)(Math.random() * 89999999)),
                "SecureP@ss123!"
        );

        MvcResult res = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(res.getResponse().getContentAsString(), AuthResponse.class);
        User user = userRepository.findById(auth.getUser().getId()).orElseThrow();
        Customer customer = customerLookupService.getOrCreateCustomerForUser(user.getId());
        customer.setKycStatus("VERIFIED");

        return new UserAuth(user, customer, auth.getAccessToken());
    }

    @Test
    @DisplayName("Should return aggregated customer dashboard with account balances and metrics")
    void shouldReturnCustomerDashboardSummary() throws Exception {
        UserAuth auth = setupVerifiedCustomer();

        Branch branch = branchRepository.findAll().get(0);
        AccountProduct product = accountProductRepository.findAll().get(0);

        Account account = new Account();
        account.setCustomerId(auth.customer().getId());
        account.setBranchId(branch.getId());
        account.setProductId(product.getId());
        account.setAccountNumber("1001" + System.currentTimeMillis() % 10000000000L);
        account.setCurrency("INR");
        account.setStatus("ACTIVE");
        account.setCurrentBalance(new BigDecimal("15000.00"));
        account.setAvailableBalance(new BigDecimal("15000.00"));
        account.setHoldBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        account.setOpenedAt(Instant.now());
        account = accountRepository.save(account);

        // Perform a deposit transaction so there is recent activity and cashflow
        transactionService.deposit(auth.user().getId(), new DepositRequest(
                account.getId(),
                new BigDecimal("5000.00"),
                "Cash deposit test"
        ), "127.0.0.1");

        mockMvc.perform(get("/api/v1/dashboard/customer")
                        .header("Authorization", "Bearer " + auth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalNetWorth").value(20000.00))
                .andExpect(jsonPath("$.activeAccountsCount").value(1))
                .andExpect(jsonPath("$.primaryAccount.accountNumber").value(account.getAccountNumber()))
                .andExpect(jsonPath("$.monthlyCredits").value(5000.00))
                .andExpect(jsonPath("$.netCashflow30d").value(5000.00))
                .andExpect(jsonPath("$.recentTransactions").isArray());
    }
}
