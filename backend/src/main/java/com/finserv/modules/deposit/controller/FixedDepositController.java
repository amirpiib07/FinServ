package com.finserv.modules.deposit.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.deposit.dto.BookFixedDepositRequest;
import com.finserv.modules.deposit.dto.FdRateSlabDto;
import com.finserv.modules.deposit.dto.FixedDepositDto;
import com.finserv.modules.deposit.service.FixedDepositService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/deposits")
@Tag(name = "Fixed Deposits", description = "FinServ Fixed Deposit Calculator, Booking & Portfolio APIs")
public class FixedDepositController {

    private final FixedDepositService fixedDepositService;

    public FixedDepositController(FixedDepositService fixedDepositService) {
        this.fixedDepositService = fixedDepositService;
    }

    @GetMapping("/rates")
    @Operation(summary = "Get current Fixed Deposit interest rate slabs and limits")
    public ResponseEntity<List<FdRateSlabDto>> getRateSlabs() {
        return ResponseEntity.ok(fixedDepositService.getRateSlabs());
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "List all Fixed Deposits belonging to the authenticated customer")
    public ResponseEntity<List<FixedDepositDto>> getCustomerDeposits(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fixedDepositService.getCustomerDeposits(principal.getUserId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Book a new Fixed Deposit from an active customer account")
    public ResponseEntity<FixedDepositDto> bookFixedDeposit(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BookFixedDepositRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        FixedDepositDto result = fixedDepositService.bookFixedDeposit(principal.getUserId(), request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
