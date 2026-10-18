package com.finserv.modules.dashboard.service;

import com.finserv.modules.account.dto.AccountDto;
import com.finserv.modules.account.entity.AccountApplication;
import com.finserv.modules.account.repository.AccountApplicationRepository;
import com.finserv.modules.account.service.AccountService;
import com.finserv.modules.beneficiary.dto.BeneficiaryDto;
import com.finserv.modules.beneficiary.service.BeneficiaryService;
import com.finserv.modules.dashboard.dto.CustomerDashboardDto;
import com.finserv.modules.dashboard.dto.DashboardAlertDto;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import com.finserv.modules.transaction.dto.TransactionPageResponse;
import com.finserv.modules.transaction.service.TransactionService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CustomerDashboardService {

    private final CustomerLookupService customerLookupService;
    private final AccountService accountService;
    private final BeneficiaryService beneficiaryService;
    private final TransactionService transactionService;
    private final AccountApplicationRepository accountApplicationRepository;

    public CustomerDashboardService(CustomerLookupService customerLookupService,
                                  AccountService accountService,
                                  BeneficiaryService beneficiaryService,
                                  TransactionService transactionService,
                                  AccountApplicationRepository accountApplicationRepository) {
        this.customerLookupService = customerLookupService;
        this.accountService = accountService;
        this.beneficiaryService = beneficiaryService;
        this.transactionService = transactionService;
        this.accountApplicationRepository = accountApplicationRepository;
    }

    public CustomerDashboardDto getCustomerDashboard(UUID userId) {
        CustomerDashboardDto dto = new CustomerDashboardDto();

        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);

        // 1. Accounts & Total Net Worth
        List<AccountDto> accounts = accountService.getCustomerAccounts(userId);
        dto.setAccounts(accounts);

        BigDecimal netWorth = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        int activeCount = 0;
        AccountDto primary = null;

        for (AccountDto acc : accounts) {
            if ("ACTIVE".equalsIgnoreCase(acc.getStatus())) {
                netWorth = netWorth.add(acc.getAvailableBalance());
                activeCount++;
                if (primary == null) {
                    primary = acc;
                } else if ("SAVINGS".equalsIgnoreCase(acc.getProductType()) && !"SAVINGS".equalsIgnoreCase(primary.getProductType())) {
                    primary = acc;
                }
            }
        }
        if (primary == null && !accounts.isEmpty()) {
            primary = accounts.get(0);
        }

        dto.setTotalNetWorth(netWorth);
        dto.setActiveAccountsCount(activeCount);
        dto.setPrimaryAccount(primary);

        // 2. Beneficiaries
        List<BeneficiaryDto> beneficiaries = beneficiaryService.getCustomerBeneficiaries(userId);
        List<BeneficiaryDto> verifiedBeneficiaries = beneficiaries.stream()
                .filter(b -> "VERIFIED".equalsIgnoreCase(b.getVerificationStatus()))
                .toList();
        dto.setVerifiedBeneficiariesCount(verifiedBeneficiaries.size());
        dto.setTopBeneficiaries(verifiedBeneficiaries.stream().limit(5).toList());

        // 3. Transactions & 30-Day Cashflow
        Instant now = Instant.now();
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);

        TransactionPageResponse recentTxnResponse = transactionService.getTransactions(
                userId, null, null, null, null, null, 0, 5
        );
        dto.setRecentTransactions(recentTxnResponse.getItems());

        TransactionPageResponse monthTxnResponse = transactionService.getTransactions(
                userId, null, null, thirtyDaysAgo, now, null, 0, 1000
        );
        dto.setMonthlyCredits(monthTxnResponse.getSummary().getTotalCredits());
        dto.setMonthlyDebits(monthTxnResponse.getSummary().getTotalDebits());
        dto.setNetCashflow30d(monthTxnResponse.getSummary().getNetCashflow());

        // 4. Alerts
        List<DashboardAlertDto> alerts = new ArrayList<>();

        // Check frozen accounts
        boolean hasFrozen = accounts.stream().anyMatch(a -> "FROZEN".equalsIgnoreCase(a.getStatus()));
        if (hasFrozen) {
            alerts.add(new DashboardAlertDto(
                    "ALERT_ACCOUNT_FROZEN",
                    "ALERT",
                    "Account Security Hold Applied",
                    "One or more of your accounts is temporarily frozen. Outward debits are restricted. Please contact customer care.",
                    "/app/accounts",
                    "View Accounts"
            ));
        }

        // Check pending account applications
        List<AccountApplication> pendingApps = accountApplicationRepository.findByCustomerId(customer.getId())
                .stream()
                .filter(a -> "SUBMITTED".equalsIgnoreCase(a.getApplicationStatus()) || "UNDER_REVIEW".equalsIgnoreCase(a.getApplicationStatus()))
                .toList();
        if (!pendingApps.isEmpty()) {
            alerts.add(new DashboardAlertDto(
                    "ALERT_PENDING_APPLICATION",
                    "INFO",
                    "Account Application Under Review",
                    "Your application for a new account (" + pendingApps.get(0).getApplicationNumber() + ") is undergoing branch verification.",
                    "/app/accounts",
                    "Track Status"
            ));
        }

        // Proactive security reminder
        alerts.add(new DashboardAlertDto(
                "INFO_SECURITY_ADVISORY",
                "SUCCESS",
                "Bank-Grade Security Active",
                "Your account is protected by hardware-bound dual-token authentication, AES-256-GCM encryption, and 24/7 audit logging.",
                "/app/audit",
                "Security Logs"
        ));

        dto.setAlerts(alerts);
        return dto;
    }
}
