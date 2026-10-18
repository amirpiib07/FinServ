package com.finserv.modules.transaction.service;

import com.finserv.common.exception.ForbiddenOperationException;
import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.exception.ValidationException;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.entity.GlChartOfAccount;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.account.repository.GlChartOfAccountRepository;
import com.finserv.modules.audit.service.AuditService;
import com.finserv.modules.beneficiary.entity.Beneficiary;
import com.finserv.modules.beneficiary.repository.BeneficiaryRepository;
import com.finserv.modules.ledger.entity.GlJournalEntry;
import com.finserv.modules.ledger.repository.GlJournalEntryRepository;
import com.finserv.modules.ledger.service.LedgerPostingService;
import com.finserv.modules.ledger.service.PostingInstruction;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import com.finserv.modules.organization.repository.BranchRepository;
import com.finserv.modules.transaction.dto.*;
import com.finserv.modules.transaction.entity.IdempotencyRecord;
import com.finserv.modules.transaction.entity.Transaction;
import com.finserv.modules.transaction.repository.TransactionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private static final String GL_CODE_VAULT_CASH = "10100";
    private static final String GL_CODE_SETTLEMENT_TRANSIT = "10300";

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final AccountProductRepository accountProductRepository;
    private final GlChartOfAccountRepository glChartOfAccountRepository;
    private final GlJournalEntryRepository glJournalEntryRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final BranchRepository branchRepository;
    private final CustomerLookupService customerLookupService;
    private final LedgerPostingService ledgerPostingService;
    private final IdempotencyService idempotencyService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public TransactionService(TransactionRepository transactionRepository,
                              AccountRepository accountRepository,
                              AccountProductRepository accountProductRepository,
                              GlChartOfAccountRepository glChartOfAccountRepository,
                              GlJournalEntryRepository glJournalEntryRepository,
                              BeneficiaryRepository beneficiaryRepository,
                              BranchRepository branchRepository,
                              CustomerLookupService customerLookupService,
                              LedgerPostingService ledgerPostingService,
                              IdempotencyService idempotencyService,
                              AuditService auditService,
                              ObjectMapper objectMapper) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.accountProductRepository = accountProductRepository;
        this.glChartOfAccountRepository = glChartOfAccountRepository;
        this.glJournalEntryRepository = glJournalEntryRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.branchRepository = branchRepository;
        this.customerLookupService = customerLookupService;
        this.ledgerPostingService = ledgerPostingService;
        this.idempotencyService = idempotencyService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    /**
     * Self-service cash/funding deposit into an active customer account.
     * Credits Customer Account & Product Liability GL; Debits Vault Cash GL.
     */
    @Transactional
    public TransactionDto deposit(UUID userId, DepositRequest req, String idempotencyKey) {
        String payloadJson = serializeOrEmpty(req);
        IdempotencyRecord idempRecord = idempotencyService.acquireOrRetrieve(userId, idempotencyKey, "/api/v1/transactions/deposit", payloadJson);
        if ("COMPLETED".equalsIgnoreCase(idempRecord.getStatus()) && idempRecord.getResponsePayload() != null) {
            return deserializePayload(idempRecord.getResponsePayload(), TransactionDto.class);
        }

        BigDecimal amount = req.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Deposit amount must be strictly positive.");
        }

        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        Account account = accountRepository.findByIdWithLock(req.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + req.getAccountId()));

        if (!account.getCustomerId().equals(customer.getId())) {
            throw new ForbiddenOperationException("Access denied: You do not own this account.");
        }
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new ValidationException("Cannot deposit into an inactive account (status: " + account.getStatus() + ").");
        }

        // Balance updates
        BigDecimal newCurrentBalance = account.getCurrentBalance().add(amount);
        account.setCurrentBalance(newCurrentBalance);
        account.setAvailableBalance(newCurrentBalance.subtract(account.getHoldBalance()));
        account = accountRepository.save(account);

        // General Ledger Postings
        UUID productId = account.getProductId();
        AccountProduct product = accountProductRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        GlChartOfAccount vaultGl = glChartOfAccountRepository.findByGlCode(GL_CODE_VAULT_CASH)
                .orElseThrow(() -> new IllegalStateException("Vault Cash GL account (10100) not configured"));

        String narration = req.getDescription() != null && !req.getDescription().isBlank()
                ? req.getDescription().trim()
                : "Account cash funding / Instant deposit";

        List<PostingInstruction> instructions = List.of(
                new PostingInstruction(vaultGl.getId(), null, "DEBIT", amount),
                new PostingInstruction(product.getGlAccountId(), account.getId(), "CREDIT", amount)
        );

        GlJournalEntry journal = ledgerPostingService.recordJournalEntry("DEPOSIT", narration, userId, instructions);

        // Transaction Record
        String txnRef = generateTransactionReference();
        Transaction txn = new Transaction();
        txn.setTransactionReference(txnRef);
        txn.setFromAccountId(null);
        txn.setToAccountId(account.getId());
        txn.setTransactionType("DEPOSIT");
        txn.setAmount(amount);
        txn.setFeeAmount(BigDecimal.ZERO.setScale(2));
        txn.setCurrency("INR");
        txn.setFromAccountBalanceAfter(null);
        txn.setToAccountBalanceAfter(account.getAvailableBalance());
        txn.setStatus("COMPLETED");
        txn.setChannel("WEB");
        txn.setInitiatedByUserId(userId);
        txn.setBranchId(account.getBranchId());
        txn.setIdempotencyRecordId(idempRecord.getId());
        txn.setJournalEntryId(journal.getId());
        txn.setDescription(narration);
        txn.setCompletedAt(Instant.now());

        txn = transactionRepository.save(txn);

        // Tamper-evident Audit log
        auditService.logEvent(
                "DEPOSIT_COMPLETED",
                "TRANSACTION",
                txn.getId(),
                userId,
                "ROLE_CUSTOMER",
                "CREATE",
                null,
                Map.of(
                        "transactionReference", txnRef,
                        "accountId", account.getId().toString(),
                        "accountNumber", mask(account.getAccountNumber()),
                        "amount", amount.toString(),
                        "balanceAfter", account.getAvailableBalance().toString(),
                        "journalReference", journal.getJournalReference()
                )
        );

        TransactionDto dto = mapToDto(txn, account, null, "CREDIT", "DEPOSIT");
        idempotencyService.markCompleted(idempRecord, 200, serializeOrEmpty(dto));
        return dto;
    }

    /**
     * Cash or ATM withdrawal from an active customer account.
     * Debits Customer Account & Product Liability GL; Credits Vault Cash GL.
     */
    @Transactional
    public TransactionDto withdraw(UUID userId, WithdrawRequest req, String idempotencyKey) {
        String payloadJson = serializeOrEmpty(req);
        IdempotencyRecord idempRecord = idempotencyService.acquireOrRetrieve(userId, idempotencyKey, "/api/v1/transactions/withdraw", payloadJson);
        if ("COMPLETED".equalsIgnoreCase(idempRecord.getStatus()) && idempRecord.getResponsePayload() != null) {
            return deserializePayload(idempRecord.getResponsePayload(), TransactionDto.class);
        }

        BigDecimal amount = req.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Withdrawal amount must be strictly positive.");
        }

        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        Account account = accountRepository.findByIdWithLock(req.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + req.getAccountId()));

        if (!account.getCustomerId().equals(customer.getId())) {
            throw new ForbiddenOperationException("Access denied: You do not own this account.");
        }
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new ValidationException("Cannot withdraw from an inactive account (status: " + account.getStatus() + ").");
        }
        if (account.getAvailableBalance().compareTo(amount) < 0) {
            throw new ValidationException(String.format("Insufficient available balance. Requested: ₹%s, Available: ₹%s",
                    amount, account.getAvailableBalance()));
        }

        // Balance updates
        BigDecimal newCurrentBalance = account.getCurrentBalance().subtract(amount);
        account.setCurrentBalance(newCurrentBalance);
        account.setAvailableBalance(newCurrentBalance.subtract(account.getHoldBalance()));
        account = accountRepository.save(account);

        // General Ledger Postings
        UUID withdrawProductId = account.getProductId();
        AccountProduct product = accountProductRepository.findById(withdrawProductId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + withdrawProductId));
        GlChartOfAccount vaultGl = glChartOfAccountRepository.findByGlCode(GL_CODE_VAULT_CASH)
                .orElseThrow(() -> new IllegalStateException("Vault Cash GL account (10100) not configured"));

        String narration = req.getDescription() != null && !req.getDescription().isBlank()
                ? req.getDescription().trim()
                : "Cash withdrawal / Counter debit";

        List<PostingInstruction> instructions = List.of(
                new PostingInstruction(product.getGlAccountId(), account.getId(), "DEBIT", amount),
                new PostingInstruction(vaultGl.getId(), null, "CREDIT", amount)
        );

        GlJournalEntry journal = ledgerPostingService.recordJournalEntry("WITHDRAWAL", narration, userId, instructions);

        // Transaction Record
        String txnRef = generateTransactionReference();
        Transaction txn = new Transaction();
        txn.setTransactionReference(txnRef);
        txn.setFromAccountId(account.getId());
        txn.setToAccountId(null);
        txn.setTransactionType("WITHDRAWAL");
        txn.setAmount(amount);
        txn.setFeeAmount(BigDecimal.ZERO.setScale(2));
        txn.setCurrency("INR");
        txn.setFromAccountBalanceAfter(account.getAvailableBalance());
        txn.setToAccountBalanceAfter(null);
        txn.setStatus("COMPLETED");
        txn.setChannel("WEB");
        txn.setInitiatedByUserId(userId);
        txn.setBranchId(account.getBranchId());
        txn.setIdempotencyRecordId(idempRecord.getId());
        txn.setJournalEntryId(journal.getId());
        txn.setDescription(narration);
        txn.setCompletedAt(Instant.now());

        txn = transactionRepository.save(txn);

        // Audit Log
        auditService.logEvent(
                "WITHDRAWAL_COMPLETED",
                "TRANSACTION",
                txn.getId(),
                userId,
                "ROLE_CUSTOMER",
                "CREATE",
                null,
                Map.of(
                        "transactionReference", txnRef,
                        "accountId", account.getId().toString(),
                        "accountNumber", mask(account.getAccountNumber()),
                        "amount", amount.toString(),
                        "balanceAfter", account.getAvailableBalance().toString(),
                        "journalReference", journal.getJournalReference()
                )
        );

        TransactionDto dto = mapToDto(txn, account, null, "DEBIT", "WITHDRAWAL");
        idempotencyService.markCompleted(idempRecord, 200, serializeOrEmpty(dto));
        return dto;
    }

    /**
     * Executes internal or beneficiary money transfer.
     * Supports:
     * 1. Beneficiary transfers (Internal FinServ credit or Outward Clearing Settlement).
     * 2. Self/Own account transfers or direct FinServ transfers.
     */
    @Transactional
    public TransactionDto transfer(UUID userId, TransferRequest req, String idempotencyKey) {
        String payloadJson = serializeOrEmpty(req);
        IdempotencyRecord idempRecord = idempotencyService.acquireOrRetrieve(userId, idempotencyKey, "/api/v1/transactions/transfer", payloadJson);
        if ("COMPLETED".equalsIgnoreCase(idempRecord.getStatus()) && idempRecord.getResponsePayload() != null) {
            return deserializePayload(idempRecord.getResponsePayload(), TransactionDto.class);
        }

        BigDecimal amount = req.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Transfer amount must be strictly positive.");
        }

        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        UUID fromAccountId = req.getFromAccountId();

        boolean isInternal = false;
        Account targetInternalAccount = null;
        Beneficiary beneficiary = null;
        String transferMode = req.getTransferMode() != null ? req.getTransferMode().toUpperCase() : "IMPS";
        String counterpartyName = "Beneficiary Transfer";

        if ("BENEFICIARY".equalsIgnoreCase(req.getTransferType()) || req.getBeneficiaryId() != null) {
            if (req.getBeneficiaryId() == null) {
                throw new ValidationException("Beneficiary ID is required for beneficiary transfers.");
            }
            beneficiary = beneficiaryRepository.findById(req.getBeneficiaryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found: " + req.getBeneficiaryId()));

            if (!beneficiary.getCustomerId().equals(customer.getId())) {
                throw new ForbiddenOperationException("Access denied: You do not own this beneficiary.");
            }
            if (!beneficiary.isActive()) {
                throw new ValidationException("Beneficiary is inactive.");
            }
            if (!"VERIFIED".equalsIgnoreCase(beneficiary.getVerificationStatus())) {
                throw new ValidationException("Beneficiary is not yet verified (status: " + beneficiary.getVerificationStatus() + ").");
            }
            if (beneficiary.getCoolingOffUntil() != null && Instant.now().isBefore(beneficiary.getCoolingOffUntil())) {
                BigDecimal coolingLimit = new BigDecimal("50000.00");
                if (amount.compareTo(coolingLimit) > 0) {
                    throw new ValidationException("Beneficiary is in cooling-off period. Maximum allowed transfer is ₹50,000.00.");
                }
            }
            if (beneficiary.getDailyTransferLimit() != null && amount.compareTo(beneficiary.getDailyTransferLimit()) > 0) {
                throw new ValidationException(String.format("Transfer amount ₹%s exceeds beneficiary daily limit ₹%s.",
                        amount, beneficiary.getDailyTransferLimit()));
            }

            counterpartyName = beneficiary.getBeneficiaryName();

            // Check if beneficiary is an internal FinServ account
            Optional<Account> internalOpt = accountRepository.findByAccountNumber(beneficiary.getAccountNumber().trim());
            if (internalOpt.isPresent()) {
                targetInternalAccount = internalOpt.get();
                isInternal = true;
                transferMode = "INTERNAL";
            }
        } else {
            // Self Transfer or Direct Account Number Transfer
            if (req.getDestinationAccountNumber() == null || req.getDestinationAccountNumber().trim().isEmpty()) {
                throw new ValidationException("Destination account number is required.");
            }
            targetInternalAccount = accountRepository.findByAccountNumber(req.getDestinationAccountNumber().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination account not found: " + req.getDestinationAccountNumber()));
            isInternal = true;
            transferMode = "INTERNAL";
            counterpartyName = "Self / Direct Transfer (" + mask(targetInternalAccount.getAccountNumber()) + ")";
        }

        // Guard distinct accounts
        if (isInternal && fromAccountId.equals(targetInternalAccount.getId())) {
            throw new ValidationException("Source and destination accounts must be distinct.");
        }

        // Acquire pessimistic write locks in deterministic ascending UUID order to eliminate deadlock risk
        Account fromAccount;
        Account toAccount = null;

        if (isInternal) {
            UUID toAccountId = targetInternalAccount.getId();
            UUID firstId = fromAccountId.compareTo(toAccountId) < 0 ? fromAccountId : toAccountId;
            UUID secondId = fromAccountId.compareTo(toAccountId) < 0 ? toAccountId : fromAccountId;

            accountRepository.findByIdWithLock(firstId);
            accountRepository.findByIdWithLock(secondId);

            fromAccount = accountRepository.findById(fromAccountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));
            toAccount = accountRepository.findById(toAccountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));
        } else {
            fromAccount = accountRepository.findByIdWithLock(fromAccountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Source account not found: " + fromAccountId));
        }

        if (!fromAccount.getCustomerId().equals(customer.getId())) {
            throw new ForbiddenOperationException("Access denied: You do not own the source account.");
        }
        if (!"ACTIVE".equalsIgnoreCase(fromAccount.getStatus())) {
            throw new ValidationException("Source account is not active.");
        }
        if (fromAccount.getAvailableBalance().compareTo(amount) < 0) {
            throw new ValidationException(String.format("Insufficient available balance. Requested: ₹%s, Available: ₹%s",
                    amount, fromAccount.getAvailableBalance()));
        }

        if (isInternal && !"ACTIVE".equalsIgnoreCase(toAccount.getStatus())) {
            throw new ValidationException("Destination account is not active (status: " + toAccount.getStatus() + ").");
        }

        // Debit sender
        BigDecimal fromNewCurrent = fromAccount.getCurrentBalance().subtract(amount);
        fromAccount.setCurrentBalance(fromNewCurrent);
        fromAccount.setAvailableBalance(fromNewCurrent.subtract(fromAccount.getHoldBalance()));
        fromAccount = accountRepository.save(fromAccount);

        AccountProduct fromProduct = accountProductRepository.findById(fromAccount.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        String narration = req.getDescription() != null && !req.getDescription().isBlank()
                ? req.getDescription().trim()
                : (isInternal ? "Internal funds transfer" : transferMode + " transfer to " + counterpartyName);

        GlJournalEntry journal;
        Transaction txn = new Transaction();
        txn.setTransactionReference(generateTransactionReference());
        txn.setAmount(amount);
        txn.setFeeAmount(BigDecimal.ZERO.setScale(2));
        txn.setCurrency("INR");
        txn.setFromAccountBalanceAfter(fromAccount.getAvailableBalance());
        txn.setStatus("COMPLETED");
        txn.setChannel("WEB");
        txn.setInitiatedByUserId(userId);
        txn.setBranchId(fromAccount.getBranchId());
        txn.setIdempotencyRecordId(idempRecord.getId());
        txn.setDescription(narration);
        txn.setCompletedAt(Instant.now());

        if (isInternal) {
            // Credit receiver
            BigDecimal toNewCurrent = toAccount.getCurrentBalance().add(amount);
            toAccount.setCurrentBalance(toNewCurrent);
            toAccount.setAvailableBalance(toNewCurrent.subtract(toAccount.getHoldBalance()));
            toAccount = accountRepository.save(toAccount);

            AccountProduct toProduct = accountProductRepository.findById(toAccount.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination product not found"));

            List<PostingInstruction> instructions = List.of(
                    new PostingInstruction(fromProduct.getGlAccountId(), fromAccount.getId(), "DEBIT", amount),
                    new PostingInstruction(toProduct.getGlAccountId(), toAccount.getId(), "CREDIT", amount)
            );
            journal = ledgerPostingService.recordJournalEntry("TRANSFER_INTERNAL", narration, userId, instructions);

            txn.setFromAccountId(fromAccount.getId());
            txn.setToAccountId(toAccount.getId());
            txn.setTransactionType("TRANSFER_INTERNAL");
            txn.setToAccountBalanceAfter(toAccount.getAvailableBalance());
        } else {
            // Outward External Transfer (IMPS / NEFT) to external clearing
            GlChartOfAccount transitGl = glChartOfAccountRepository.findByGlCode(GL_CODE_SETTLEMENT_TRANSIT)
                    .orElseThrow(() -> new IllegalStateException("Inter-Bank Settlement Transit GL (10300) not configured"));

            List<PostingInstruction> instructions = List.of(
                    new PostingInstruction(fromProduct.getGlAccountId(), fromAccount.getId(), "DEBIT", amount),
                    new PostingInstruction(transitGl.getId(), null, "CREDIT", amount)
            );
            journal = ledgerPostingService.recordJournalEntry("TRANSFER_EXTERNAL", narration, userId, instructions);

            txn.setFromAccountId(fromAccount.getId());
            txn.setToAccountId(null);
            txn.setTransactionType("TRANSFER_EXTERNAL");
            txn.setToAccountBalanceAfter(null);
        }

        txn.setJournalEntryId(journal.getId());
        txn = transactionRepository.save(txn);

        // Audit Log
        auditService.logEvent(
                "TRANSFER_COMPLETED",
                "TRANSACTION",
                txn.getId(),
                userId,
                "ROLE_CUSTOMER",
                "CREATE",
                null,
                Map.of(
                        "transactionReference", txn.getTransactionReference(),
                        "fromAccountId", fromAccount.getId().toString(),
                        "toAccountId", toAccount != null ? toAccount.getId().toString() : "EXTERNAL",
                        "amount", amount.toString(),
                        "mode", transferMode,
                        "journalReference", journal.getJournalReference()
                )
        );

        TransactionDto dto = mapToDto(txn, fromAccount, toAccount, "DEBIT", transferMode);
        dto.setCounterpartyName(counterpartyName);
        idempotencyService.markCompleted(idempRecord, 200, serializeOrEmpty(dto));
        return dto;
    }

    /**
     * Paginated transaction passbook statement for a customer's specific account or all owned accounts.
     */
    @Transactional(readOnly = true)
    public TransactionPageResponse getTransactions(UUID userId,
                                                   UUID accountIdFilter,
                                                   String typeFilter,
                                                   Instant startDate,
                                                   Instant endDate,
                                                   String query,
                                                   int page,
                                                   int size) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        List<Account> customerAccounts = accountRepository.findByCustomerId(customer.getId());
        if (customerAccounts.isEmpty()) {
            return new TransactionPageResponse(List.of(), new TransactionSummaryDto(), page, size, 0, 0);
        }

        Map<UUID, Account> accountMap = new HashMap<>();
        for (Account acc : customerAccounts) {
            accountMap.put(acc.getId(), acc);
        }

        List<UUID> accountIds = null;
        UUID singleAccountId = null;

        if (accountIdFilter != null) {
            if (!accountMap.containsKey(accountIdFilter)) {
                throw new ForbiddenOperationException("Access denied: You do not own this account.");
            }
            singleAccountId = accountIdFilter;
        } else {
            accountIds = new ArrayList<>(accountMap.keySet());
        }

        String search = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String mappedType = (typeFilter != null && !typeFilter.equalsIgnoreCase("ALL") && !typeFilter.isBlank())
                ? typeFilter.toUpperCase()
                : null;

        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Transaction> txnPage = transactionRepository.findFilteredTransactions(
                singleAccountId,
                accountIds,
                startDate,
                endDate,
                mappedType,
                search,
                pageRequest
        );

        List<Transaction> summaryList = transactionRepository.findTransactionsForSummary(
                singleAccountId,
                accountIds,
                startDate,
                endDate
        );

        final UUID focalAccountId = singleAccountId;
        TransactionSummaryDto summary = computeSummary(summaryList, focalAccountId, accountMap.keySet());

        List<TransactionDto> items = txnPage.getContent().stream()
                .map(t -> {
                    Account from = t.getFromAccountId() != null ? accountMap.get(t.getFromAccountId()) : null;
                    Account to = t.getToAccountId() != null ? accountMap.get(t.getToAccountId()) : null;
                    String direction = determineDirection(t, focalAccountId, accountMap.keySet());
                    return mapToDto(t, from, to, direction, resolveMode(t));
                })
                .toList();

        return new TransactionPageResponse(items, summary, txnPage.getNumber(), txnPage.getSize(),
                txnPage.getTotalElements(), txnPage.getTotalPages());
    }

    /**
     * Retrieves printable receipt details for a transaction.
     */
    @Transactional(readOnly = true)
    public TransactionReceiptDto getTransactionReceipt(UUID userId, UUID transactionId) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        Account fromAcc = txn.getFromAccountId() != null ? accountRepository.findById(txn.getFromAccountId()).orElse(null) : null;
        Account toAcc = txn.getToAccountId() != null ? accountRepository.findById(txn.getToAccountId()).orElse(null) : null;

        boolean isFromOwner = fromAcc != null && fromAcc.getCustomerId().equals(customer.getId());
        boolean isToOwner = toAcc != null && toAcc.getCustomerId().equals(customer.getId());

        if (!isFromOwner && !isToOwner) {
            throw new ForbiddenOperationException("Access denied: You are not authorized to view this receipt.");
        }

        TransactionReceiptDto receipt = new TransactionReceiptDto();
        receipt.setId(txn.getId());
        receipt.setTransactionReference(txn.getTransactionReference());
        receipt.setStatus(txn.getStatus());
        receipt.setTransactionType(txn.getTransactionType());
        receipt.setTransferMode(resolveMode(txn));
        receipt.setAmount(txn.getAmount());
        receipt.setFeeAmount(txn.getFeeAmount());
        receipt.setCurrency(txn.getCurrency());
        receipt.setChannel(txn.getChannel());
        receipt.setDescription(txn.getDescription());
        receipt.setCreatedAt(txn.getCreatedAt());
        receipt.setCompletedAt(txn.getCompletedAt());

        if (fromAcc != null) {
            receipt.setFromAccountId(fromAcc.getId());
            receipt.setFromAccountNumber(mask(fromAcc.getAccountNumber()));
            receipt.setFromAccountHolderName(customer.getFirstName() + " " + customer.getLastName());
            branchRepository.findById(fromAcc.getBranchId()).ifPresent(b -> {
                receipt.setFromAccountBranch(b.getBranchName());
                receipt.setFromAccountIfsc(b.getIfscCode());
            });
            receipt.setFromAccountBalanceAfter(txn.getFromAccountBalanceAfter());
        }

        if (toAcc != null) {
            receipt.setToAccountId(toAcc.getId());
            receipt.setToAccountNumber(mask(toAcc.getAccountNumber()));
            receipt.setToBankName("FINServ Mumbai Main");
            branchRepository.findById(toAcc.getBranchId()).ifPresent(b -> {
                receipt.setToIfscCode(b.getIfscCode());
            });
            receipt.setToAccountBalanceAfter(txn.getToAccountBalanceAfter());
        }

        // Running balance for the requesting user's perspective
        receipt.setRunningBalance(isFromOwner ? txn.getFromAccountBalanceAfter() : txn.getToAccountBalanceAfter());

        if (txn.getJournalEntryId() != null) {
            glJournalEntryRepository.findById(txn.getJournalEntryId())
                    .ifPresent(j -> receipt.setJournalReference(j.getJournalReference()));
        }

        return receipt;
    }

    private TransactionSummaryDto computeSummary(List<Transaction> txns, UUID focalAccountId, Set<UUID> userAccountIds) {
        BigDecimal totalCredits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalDebits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        for (Transaction t : txns) {
            if ("COMPLETED".equalsIgnoreCase(t.getStatus())) {
                String dir = determineDirection(t, focalAccountId, userAccountIds);
                if ("CREDIT".equalsIgnoreCase(dir)) {
                    totalCredits = totalCredits.add(t.getAmount());
                } else if ("DEBIT".equalsIgnoreCase(dir)) {
                    totalDebits = totalDebits.add(t.getAmount());
                }
            }
        }

        BigDecimal netCashflow = totalCredits.subtract(totalDebits);
        return new TransactionSummaryDto(totalCredits, totalDebits, netCashflow, txns.size());
    }

    private String determineDirection(Transaction t, UUID focalAccountId, Set<UUID> userAccountIds) {
        if (focalAccountId != null) {
            if (focalAccountId.equals(t.getToAccountId())) {
                return "CREDIT";
            } else if (focalAccountId.equals(t.getFromAccountId())) {
                return "DEBIT";
            }
        }
        // Account-wide view
        boolean toIsUser = t.getToAccountId() != null && userAccountIds.contains(t.getToAccountId());
        boolean fromIsUser = t.getFromAccountId() != null && userAccountIds.contains(t.getFromAccountId());

        if (toIsUser && !fromIsUser) return "CREDIT";
        if (fromIsUser && !toIsUser) return "DEBIT";
        return "SELF";
    }

    private String resolveMode(Transaction t) {
        if ("DEPOSIT".equalsIgnoreCase(t.getTransactionType())) return "DEPOSIT";
        if ("WITHDRAWAL".equalsIgnoreCase(t.getTransactionType())) return "WITHDRAWAL";
        if ("TRANSFER_INTERNAL".equalsIgnoreCase(t.getTransactionType())) return "INTERNAL";
        return "IMPS";
    }

    private TransactionDto mapToDto(Transaction t, Account from, Account to, String direction, String mode) {
        TransactionDto dto = new TransactionDto();
        dto.setId(t.getId());
        dto.setTransactionReference(t.getTransactionReference());
        dto.setFromAccountId(t.getFromAccountId());
        dto.setFromAccountNumber(from != null ? mask(from.getAccountNumber()) : null);
        dto.setToAccountId(t.getToAccountId());
        dto.setToAccountNumber(to != null ? mask(to.getAccountNumber()) : null);
        dto.setTransactionType(t.getTransactionType());
        dto.setAmount(t.getAmount());
        dto.setFeeAmount(t.getFeeAmount());
        dto.setCurrency(t.getCurrency());
        dto.setFromAccountBalanceAfter(t.getFromAccountBalanceAfter());
        dto.setToAccountBalanceAfter(t.getToAccountBalanceAfter());
        dto.setRunningBalance("CREDIT".equalsIgnoreCase(direction) ? t.getToAccountBalanceAfter() : t.getFromAccountBalanceAfter());
        dto.setDirection(direction);
        dto.setStatus(t.getStatus());
        dto.setFailureReason(t.getFailureReason());
        dto.setChannel(t.getChannel());
        dto.setDescription(t.getDescription());
        dto.setTransferMode(mode);
        dto.setCreatedAt(t.getCreatedAt());
        dto.setCompletedAt(t.getCompletedAt());

        if (to != null && from != null && !to.getId().equals(from.getId())) {
            dto.setCounterpartyName("Account " + mask(to.getAccountNumber()));
        } else if ("DEPOSIT".equalsIgnoreCase(t.getTransactionType())) {
            dto.setCounterpartyName("Self-Service Deposit");
        } else if ("WITHDRAWAL".equalsIgnoreCase(t.getTransactionType())) {
            dto.setCounterpartyName("Cash Withdrawal");
        }

        return dto;
    }

    private String generateTransactionReference() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String randomHex = UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        return "FSV" + datePart + randomHex;
    }

    private String mask(String accNum) {
        if (accNum == null || accNum.length() < 4) return accNum;
        return "•••• " + accNum.substring(accNum.length() - 4);
    }

    private String serializeOrEmpty(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize request/response: {}", e.getMessage());
            return "{}";
        }
    }

    private <T> T deserializePayload(String json, Class<T> clazz) {
        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize idempotency response payload", e);
        }
    }
}
