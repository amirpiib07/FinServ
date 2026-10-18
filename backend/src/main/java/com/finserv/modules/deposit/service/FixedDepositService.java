package com.finserv.modules.deposit.service;

import com.finserv.common.exception.ForbiddenOperationException;
import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.exception.ValidationException;
import com.finserv.common.util.UuidUtils;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.audit.service.AuditService;
import com.finserv.modules.deposit.dto.BookFixedDepositRequest;
import com.finserv.modules.deposit.dto.FdRateSlabDto;
import com.finserv.modules.deposit.dto.FixedDepositDto;
import com.finserv.modules.deposit.entity.FixedDeposit;
import com.finserv.modules.deposit.repository.FixedDepositRepository;
import com.finserv.modules.ledger.service.LedgerPostingService;
import com.finserv.modules.ledger.service.PostingInstruction;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import com.finserv.modules.transaction.entity.Transaction;
import com.finserv.modules.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FixedDepositService {

    private static final Logger log = LoggerFactory.getLogger(FixedDepositService.class);

    private static final UUID GL_SAVINGS_LIABILITY = UUID.fromString("00000000-0000-0000-0001-000000020100");
    private static final UUID GL_TERM_DEPOSIT_LIABILITY = UUID.fromString("00000000-0000-0000-0001-000000020300");

    private static final List<FdRateSlabDto> RATE_SLABS = List.of(
            new FdRateSlabDto(6, "6 Months", new BigDecimal("6.50"), new BigDecimal("1000.00"), new BigDecimal("5000000.00")),
            new FdRateSlabDto(12, "1 Year (12M)", new BigDecimal("7.25"), new BigDecimal("1000.00"), new BigDecimal("5000000.00")),
            new FdRateSlabDto(24, "2 Years (24M)", new BigDecimal("7.50"), new BigDecimal("1000.00"), new BigDecimal("5000000.00")),
            new FdRateSlabDto(36, "3 Years (36M)", new BigDecimal("7.75"), new BigDecimal("1000.00"), new BigDecimal("5000000.00"))
    );

    private final FixedDepositRepository fixedDepositRepository;
    private final AccountRepository accountRepository;
    private final CustomerLookupService customerLookupService;
    private final LedgerPostingService ledgerPostingService;
    private final TransactionRepository transactionRepository;
    private final AuditService auditService;

    public FixedDepositService(FixedDepositRepository fixedDepositRepository,
                               AccountRepository accountRepository,
                               CustomerLookupService customerLookupService,
                               LedgerPostingService ledgerPostingService,
                               TransactionRepository transactionRepository,
                               AuditService auditService) {
        this.fixedDepositRepository = fixedDepositRepository;
        this.accountRepository = accountRepository;
        this.customerLookupService = customerLookupService;
        this.ledgerPostingService = ledgerPostingService;
        this.transactionRepository = transactionRepository;
        this.auditService = auditService;
    }

    public List<FdRateSlabDto> getRateSlabs() {
        return RATE_SLABS;
    }

    @Transactional(readOnly = true)
    public List<FixedDepositDto> getCustomerDeposits(UUID userId) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        return fixedDepositRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public FixedDepositDto bookFixedDeposit(UUID userId, BookFixedDepositRequest request, String idempotencyKey) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);

        if (request.principalAmount() == null || request.principalAmount().compareTo(new BigDecimal("1000.00")) < 0) {
            throw new ValidationException("Minimum Fixed Deposit booking amount is ₹1,000.00");
        }

        // Validate rate slab
        BigDecimal rate = determineInterestRate(request.tenureMonths());

        // Validate source account
        Account sourceAccount = accountRepository.findById(request.sourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.sourceAccountId()));

        if (!sourceAccount.getCustomerId().equals(customer.getId())) {
            throw new ForbiddenOperationException("Unauthorized: source account does not belong to the authenticated customer.");
        }

        if (!"ACTIVE".equalsIgnoreCase(sourceAccount.getStatus())) {
            throw new ValidationException("Source account is " + sourceAccount.getStatus() + " and cannot fund a Fixed Deposit.");
        }

        if (sourceAccount.getAvailableBalance().compareTo(request.principalAmount()) < 0) {
            throw new ValidationException(String.format("Insufficient available balance (₹%s) in account %s to fund ₹%s Fixed Deposit.",
                    sourceAccount.getAvailableBalance().toPlainString(),
                    sourceAccount.getAccountNumber(),
                    request.principalAmount().toPlainString()));
        }

        // Exact financial interest computation using BigDecimal
        // Simple annual formula: I = (P * r * t) / (12 * 100)
        BigDecimal principal = request.principalAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal tenureMonthsBd = new BigDecimal(request.tenureMonths());
        BigDecimal interestEarned = principal
                .multiply(rate)
                .multiply(tenureMonthsBd)
                .divide(new BigDecimal("1200"), 2, RoundingMode.HALF_UP);
        BigDecimal maturityAmount = principal.add(interestEarned);

        // Deduct from customer's source account
        BigDecimal newCurrent = sourceAccount.getCurrentBalance().subtract(principal);
        BigDecimal newAvailable = sourceAccount.getAvailableBalance().subtract(principal);
        sourceAccount.setCurrentBalance(newCurrent);
        sourceAccount.setAvailableBalance(newAvailable);
        accountRepository.save(sourceAccount);

        // Generate official FD Number: e.g. FD20261018XXXX
        String dateStr = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneId.of("Asia/Kolkata")).format(Instant.now());
        String randPart = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        String depositNumber = "FD" + dateStr + randPart;

        Instant startDate = Instant.now();
        Instant maturityDate = startDate.atZone(ZoneId.of("Asia/Kolkata"))
                .plusMonths(request.tenureMonths())
                .toInstant();

        // 1. Post double-entry General Ledger balancing entry
        PostingInstruction debitCustomerSavings = new PostingInstruction(
                GL_SAVINGS_LIABILITY,
                sourceAccount.getId(),
                "DEBIT",
                principal
        );
        PostingInstruction creditTermDeposit = new PostingInstruction(
                GL_TERM_DEPOSIT_LIABILITY,
                null,
                "CREDIT",
                principal
        );

        ledgerPostingService.recordJournalEntry(
                "FIXED_DEPOSIT_BOOKING",
                "Fixed Deposit Creation #" + depositNumber + " from Account " + sourceAccount.getAccountNumber(),
                userId,
                List.of(debitCustomerSavings, creditTermDeposit)
        );

        // 2. Insert debit Transaction in customer's passbook/history
        Transaction debitTxn = new Transaction();
        debitTxn.setId(UuidUtils.generateV7());
        debitTxn.setTransactionReference("TXN" + depositNumber);
        debitTxn.setFromAccountId(sourceAccount.getId());
        debitTxn.setToAccountId(null);
        debitTxn.setTransactionType("WITHDRAWAL");
        debitTxn.setAmount(principal);
        debitTxn.setFeeAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        debitTxn.setCurrency("INR");
        debitTxn.setFromAccountBalanceAfter(newCurrent);
        debitTxn.setStatus("COMPLETED");
        debitTxn.setChannel("WEB");
        debitTxn.setDescription("Fixed Deposit Booking - Certificate #" + depositNumber);
        debitTxn.setInitiatedByUserId(userId);
        debitTxn.setCompletedAt(startDate);
        transactionRepository.save(debitTxn);

        // 3. Create FixedDeposit record
        FixedDeposit fd = new FixedDeposit();
        fd.setId(UuidUtils.generateV7());
        fd.setDepositNumber(depositNumber);
        fd.setCustomerId(customer.getId());
        fd.setSourceAccountId(sourceAccount.getId());
        fd.setPrincipalAmount(principal);
        fd.setInterestRatePercentage(rate);
        fd.setTenureMonths(request.tenureMonths());
        fd.setInterestEarned(interestEarned);
        fd.setMaturityAmount(maturityAmount);
        fd.setStatus("ACTIVE");
        fd.setStartDate(startDate);
        fd.setMaturityDate(maturityDate);

        FixedDeposit savedFd = fixedDepositRepository.save(fd);

        // 4. Cryptographic Audit Trail
        auditService.logEvent(
                "BOOK_FIXED_DEPOSIT",
                "FIXED_DEPOSIT",
                savedFd.getId(),
                userId,
                "ROLE_CUSTOMER",
                "CREATE",
                null,
                Map.of(
                        "depositNumber", depositNumber,
                        "principalAmount", principal.toString(),
                        "interestRate", rate.toString(),
                        "tenureMonths", request.tenureMonths().toString(),
                        "maturityAmount", maturityAmount.toString()
                )
        );

        log.info("Successfully booked Fixed Deposit {} for customer {} from account {}",
                depositNumber, customer.getCustomerNumber(), sourceAccount.getAccountNumber());

        return toDto(savedFd);
    }

    private BigDecimal determineInterestRate(int tenureMonths) {
        if (tenureMonths <= 6) {
            return new BigDecimal("6.50");
        } else if (tenureMonths <= 12) {
            return new BigDecimal("7.25");
        } else if (tenureMonths <= 24) {
            return new BigDecimal("7.50");
        } else {
            return new BigDecimal("7.75");
        }
    }

    private FixedDepositDto toDto(FixedDeposit fd) {
        String sourceAccNum = accountRepository.findById(fd.getSourceAccountId())
                .map(Account::getAccountNumber)
                .orElse("FinServ Account");

        return new FixedDepositDto(
                fd.getId(),
                fd.getDepositNumber(),
                fd.getCustomerId(),
                fd.getSourceAccountId(),
                sourceAccNum,
                fd.getPrincipalAmount(),
                fd.getInterestRatePercentage(),
                fd.getTenureMonths(),
                fd.getMaturityAmount(),
                fd.getInterestEarned(),
                fd.getStatus(),
                fd.getStartDate(),
                fd.getMaturityDate(),
                fd.getCreatedAt()
        );
    }
}
