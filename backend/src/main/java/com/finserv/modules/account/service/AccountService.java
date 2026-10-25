package com.finserv.modules.account.service;

import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.exception.ValidationException;
import com.finserv.modules.account.dto.*;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.entity.AccountApplication;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.repository.AccountApplicationRepository;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.audit.service.AuditService;
import com.finserv.modules.ledger.service.LedgerPostingService;
import com.finserv.modules.ledger.service.PostingInstruction;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import com.finserv.modules.organization.dto.BranchDto;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.organization.repository.BranchRepository;
import com.finserv.modules.sequence.generator.AccountNumberGenerator;
import com.finserv.modules.sequence.service.NumberSequenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final AccountRepository accountRepository;
    private final AccountProductRepository accountProductRepository;
    private final AccountApplicationRepository accountApplicationRepository;
    private final BranchRepository branchRepository;
    private final CustomerLookupService customerLookupService;
    private final AccountNumberGenerator accountNumberGenerator;
    private final NumberSequenceService numberSequenceService;
    private final AuditService auditService;
    private final LedgerPostingService ledgerPostingService;

    public AccountService(AccountRepository accountRepository,
                          AccountProductRepository accountProductRepository,
                          AccountApplicationRepository accountApplicationRepository,
                          BranchRepository branchRepository,
                          CustomerLookupService customerLookupService,
                          AccountNumberGenerator accountNumberGenerator,
                          NumberSequenceService numberSequenceService,
                          AuditService auditService,
                          LedgerPostingService ledgerPostingService) {
        this.accountRepository = accountRepository;
        this.accountProductRepository = accountProductRepository;
        this.accountApplicationRepository = accountApplicationRepository;
        this.branchRepository = branchRepository;
        this.customerLookupService = customerLookupService;
        this.accountNumberGenerator = accountNumberGenerator;
        this.numberSequenceService = numberSequenceService;
        this.auditService = auditService;
        this.ledgerPostingService = ledgerPostingService;
    }

    public List<AccountProductDto> getActiveAccountProducts() {
        return accountProductRepository.findByIsActiveTrue().stream()
                .map(p -> new AccountProductDto(
                        p.getId(),
                        p.getProductCode(),
                        p.getProductName(),
                        p.getProductType(),
                        p.getCurrency(),
                        p.getMinBalance(),
                        p.getInterestRatePercentage(),
                        p.isOverdraftAllowed(),
                        p.getOverdraftLimit(),
                        p.isActive()
                ))
                .toList();
    }

    public List<BranchDto> getActiveBranches() {
        return branchRepository.findByStatus("ACTIVE").stream()
                .map(b -> new BranchDto(
                        b.getId(),
                        b.getBranchCode(),
                        b.getBranchName(),
                        b.getIfscCode(),
                        b.getRoutingNumber(),
                        b.getStreetAddress(),
                        b.getCity(),
                        b.getState(),
                        b.getPostalCode(),
                        b.getPhoneNumber(),
                        b.getStatus()
                ))
                .toList();
    }

    @Transactional
    public AccountApplicationDto applyForAccount(UUID userId, CreateAccountApplicationRequest req) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);

        AccountProduct product = accountProductRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Account product not found: " + req.getProductId()));
        if (!product.isActive()) {
            throw new ValidationException("Selected account product is not currently active.");
        }

        Branch branch = branchRepository.findById(req.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + req.getBranchId()));
        if (!"ACTIVE".equalsIgnoreCase(branch.getStatus())) {
            throw new ValidationException("Selected branch is not currently active.");
        }

        BigDecimal defaultInitialDeposit = new BigDecimal("5000.00");
        BigDecimal deposit = (req.getInitialDepositAmount() != null && req.getInitialDepositAmount().compareTo(BigDecimal.ZERO) > 0)
                ? req.getInitialDepositAmount().setScale(2, RoundingMode.HALF_UP)
                : defaultInitialDeposit;

        if (deposit.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Initial deposit amount cannot be negative.");
        }

        String applicationNumber = "APP-" + branch.getBranchCode() + "-" + System.currentTimeMillis();

        AccountApplication application = new AccountApplication();
        application.setCustomerId(customer.getId());
        application.setProductId(product.getId());
        application.setBranchId(branch.getId());
        application.setApplicationNumber(applicationNumber);
        application.setInitialDepositAmount(deposit);

        if (req.isAutoActivate()) {
            // Instant Auto-Activation Workflow (for retail savings / dev testing)
            long sequenceNumber = numberSequenceService.getNextValue("account_num_seq");
            String accountNumber = accountNumberGenerator.generate(
                    branch.getBranchCode(),
                    product.getProductCode(),
                    sequenceNumber
            );

            Account account = new Account();
            account.setCustomerId(customer.getId());
            account.setBranchId(branch.getId());
            account.setProductId(product.getId());
            account.setAccountNumber(accountNumber);
            account.setCurrency(product.getCurrency());
            account.setCurrentBalance(deposit);
            account.setHoldBalance(BigDecimal.ZERO.setScale(2));
            account.setAvailableBalance(deposit);
            account.setStatus("ACTIVE");
            account.setNickname(req.getNickname());
            account.setOpenedAt(Instant.now());

            account = accountRepository.save(account);

            // Double-entry GL voucher posting for initial deposit
            if (deposit.compareTo(BigDecimal.ZERO) > 0) {
                try {
                    UUID cashGlId = UUID.fromString("00000000-0000-0000-0001-000000010100"); // 10100 Vault Cash
                    ledgerPostingService.recordJournalEntry(
                            "ACCOUNT_OPENING_DEPOSIT",
                            "Initial account funding of ₹" + deposit + " for " + accountNumber,
                            userId,
                            List.of(
                                    new PostingInstruction(cashGlId, null, "DEBIT", deposit),
                                    new PostingInstruction(product.getGlAccountId(), account.getId(), "CREDIT", deposit)
                            )
                    );
                } catch (Exception e) {
                    log.warn("Could not post GL voucher for initial deposit on auto-activated account {}: {}", accountNumber, e.getMessage());
                }
            }

            application.setApplicationStatus("APPROVED");
            application.setCreatedAccountId(account.getId());
            application.setReviewedAt(Instant.now());
            application = accountApplicationRepository.save(application);

            auditService.logEvent(
                    "ACCOUNT_OPENED",
                    "ACCOUNT",
                    account.getId(),
                    userId,
                    "ROLE_CUSTOMER",
                    "CREATE",
                    null,
                    Map.of(
                            "accountNumber", maskAccountNumber(accountNumber),
                            "productCode", product.getProductCode(),
                            "branchCode", branch.getBranchCode(),
                            "initialDeposit", deposit.toString(),
                            "applicationNumber", applicationNumber
                    )
            );

            log.info("Auto-activated new account {} for customer {}", accountNumber, customer.getCustomerNumber());
        } else {
            // Standard Maker-Checker Application Workflow
            application.setApplicationStatus("SUBMITTED");
            application = accountApplicationRepository.save(application);

            auditService.logEvent(
                    "ACCOUNT_APPLICATION_SUBMITTED",
                    "ACCOUNT_APPLICATION",
                    application.getId(),
                    userId,
                    "ROLE_CUSTOMER",
                    "CREATE",
                    null,
                    Map.of(
                            "applicationNumber", applicationNumber,
                            "productCode", product.getProductCode(),
                            "branchCode", branch.getBranchCode()
                    )
            );
            log.info("Submitted account application {} for customer {}", applicationNumber, customer.getCustomerNumber());
        }

        return toApplicationDto(application, product, branch);
    }

    public List<AccountDto> getCustomerAccounts(UUID userId) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());
        return accounts.stream()
                .map(this::toAccountDto)
                .toList();
    }

    public AccountDto getAccountById(UUID accountId, UUID userId, boolean isStaff) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        if (!isStaff) {
            Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
            if (!account.getCustomerId().equals(customer.getId())) {
                throw new AccessDeniedException("You do not have authorization to view this account.");
            }
        }

        return toAccountDto(account);
    }

    @Transactional
    public AccountDto updateAccountControls(UUID accountId, UUID userId, UpdateAccountControlsRequest req) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        if (!account.getCustomerId().equals(customer.getId())) {
            throw new AccessDeniedException("You do not have authorization to modify this account.");
        }

        String oldNickname = account.getNickname();
        account.setNickname(req.getNickname());
        account = accountRepository.save(account);

        auditService.logEvent(
                "ACCOUNT_CONTROLS_UPDATED",
                "ACCOUNT",
                account.getId(),
                userId,
                "ROLE_CUSTOMER",
                "UPDATE",
                Map.of("nickname", oldNickname != null ? oldNickname : ""),
                Map.of("nickname", req.getNickname() != null ? req.getNickname() : "")
        );

        return toAccountDto(account);
    }

    public List<AccountApplicationDto> getCustomerApplications(UUID userId) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        List<AccountApplication> applications = accountApplicationRepository.findByCustomerId(customer.getId());
        return applications.stream()
                .map(app -> {
                    AccountProduct product = accountProductRepository.findById(app.getProductId()).orElse(null);
                    Branch branch = app.getBranchId() != null
                            ? branchRepository.findById(app.getBranchId()).orElse(null)
                            : null;
                    return toApplicationDto(app, product, branch);
                })
                .toList();
    }

    public AccountDto toAccountDto(Account account) {
        AccountDto dto = new AccountDto();
        dto.setId(account.getId());
        dto.setCustomerId(account.getCustomerId());
        dto.setBranchId(account.getBranchId());
        dto.setProductId(account.getProductId());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setMaskedAccountNumber(maskAccountNumber(account.getAccountNumber()));
        dto.setCurrency(account.getCurrency());
        dto.setCurrentBalance(account.getCurrentBalance().setScale(2, RoundingMode.HALF_UP));
        dto.setAvailableBalance(account.getAvailableBalance().setScale(2, RoundingMode.HALF_UP));
        dto.setHoldBalance(account.getHoldBalance().setScale(2, RoundingMode.HALF_UP));
        dto.setStatus(account.getStatus());
        dto.setNickname(account.getNickname());
        dto.setOpenedAt(account.getOpenedAt());
        dto.setVersion(account.getVersion());

        branchRepository.findById(account.getBranchId()).ifPresent(branch -> {
            dto.setBranchName(branch.getBranchName());
            dto.setBranchCode(branch.getBranchCode());
            dto.setIfscCode(branch.getIfscCode());
        });

        accountProductRepository.findById(account.getProductId()).ifPresent(product -> {
            dto.setProductName(product.getProductName());
            dto.setProductCode(product.getProductCode());
            dto.setProductType(product.getProductType());
        });

        return dto;
    }

    private AccountApplicationDto toApplicationDto(AccountApplication app, AccountProduct product, Branch branch) {
        AccountApplicationDto dto = new AccountApplicationDto();
        dto.setId(app.getId());
        dto.setApplicationNumber(app.getApplicationNumber());
        dto.setCustomerId(app.getCustomerId());
        dto.setProductId(app.getProductId());
        dto.setBranchId(app.getBranchId());
        dto.setInitialDepositAmount(app.getInitialDepositAmount().setScale(2, RoundingMode.HALF_UP));
        dto.setApplicationStatus(app.getApplicationStatus());
        dto.setRejectionReason(app.getRejectionReason());
        dto.setCreatedAccountId(app.getCreatedAccountId());
        dto.setCreatedAt(app.getCreatedAt());

        if (product != null) {
            dto.setProductName(product.getProductName());
            dto.setProductCode(product.getProductCode());
        }
        if (branch != null) {
            dto.setBranchName(branch.getBranchName());
        }

        return dto;
    }

    private String maskAccountNumber(String accNum) {
        if (accNum == null || accNum.length() < 4) {
            return "••••";
        }
        String last4 = accNum.substring(accNum.length() - 4);
        return "••••••••••" + last4;
    }
}
