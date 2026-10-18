package com.finserv.modules.transaction.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.transaction.dto.*;
import com.finserv.modules.transaction.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Financial Engine & Transactions", description = "Endpoints for funds transfers, cash deposits, withdrawals, passbook statements, and receipts")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/transactions/deposit")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Instant account funding / cash deposit", description = "Credits customer account and records double-entry GL postings against vault cash")
    public ResponseEntity<TransactionDto> deposit(
            @Parameter(description = "Unique client-generated idempotency key (UUIDv4/UUIDv7)", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody DepositRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        TransactionDto txn = transactionService.deposit(principal.getUserId(), req, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(txn);
    }

    @PostMapping("/transactions/withdraw")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Cash or ATM withdrawal", description = "Debits customer account and credits vault cash after validating available balance")
    public ResponseEntity<TransactionDto> withdraw(
            @Parameter(description = "Unique client-generated idempotency key", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody WithdrawRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        TransactionDto txn = transactionService.withdraw(principal.getUserId(), req, idempotencyKey);
        return ResponseEntity.ok(txn);
    }

    @PostMapping("/transactions/transfer")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Internal & beneficiary funds transfer", description = "Executes atomic double-entry money transfer with lock order deadlock prevention")
    public ResponseEntity<TransactionDto> transfer(
            @Parameter(description = "Unique client-generated idempotency key", required = true)
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody TransferRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        TransactionDto txn = transactionService.transfer(principal.getUserId(), req, idempotencyKey);
        return ResponseEntity.ok(txn);
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Filterable customer passbook statement", description = "Returns paginated transactions with KPI cashflow summary across all owned accounts or specific account")
    public ResponseEntity<TransactionPageResponse> getTransactions(
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        TransactionPageResponse response = transactionService.getTransactions(
                principal.getUserId(), accountId, type, startDate, endDate, query, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/accounts/{accountId}/transactions")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Account-scoped passbook statement", description = "Returns paginated transactions specifically scoped to the specified account")
    public ResponseEntity<TransactionPageResponse> getAccountTransactions(
            @PathVariable UUID accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        TransactionPageResponse response = transactionService.getTransactions(
                principal.getUserId(), accountId, type, startDate, endDate, query, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions/{transactionId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Printable transaction receipt", description = "Returns full cryptographic receipt details, counterparty info, and running balance")
    public ResponseEntity<TransactionReceiptDto> getTransactionReceipt(
            @PathVariable UUID transactionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        TransactionReceiptDto receipt = transactionService.getTransactionReceipt(principal.getUserId(), transactionId);
        return ResponseEntity.ok(receipt);
    }
}
