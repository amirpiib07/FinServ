package com.finserv.modules.account.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.account.dto.*;
import com.finserv.modules.account.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@Tag(name = "Account Management", description = "Endpoints for customer bank accounts, applications, and account controls")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/applications")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Apply for a new bank account", description = "Submits an application for a savings or current account product with auto-activation option for verified customers")
    public ResponseEntity<AccountApplicationDto> applyForAccount(
            @Valid @RequestBody CreateAccountApplicationRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        AccountApplicationDto application = accountService.applyForAccount(principal.getUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(application);
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "List customer accounts", description = "Returns all active and accessible accounts owned by the authenticated customer")
    public ResponseEntity<List<AccountDto>> getMyAccounts(@AuthenticationPrincipal UserPrincipal principal) {
        List<AccountDto> accounts = accountService.getCustomerAccounts(principal.getUserId());
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{accountId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get account details by ID", description = "Returns account details, branch info, balances, and status with strict ownership validation")
    public ResponseEntity<AccountDto> getAccountById(
            @PathVariable UUID accountId,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isStaff = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_EMPLOYEE") || a.getAuthority().equals("ROLE_MANAGER"));
        AccountDto account = accountService.getAccountById(accountId, principal.getUserId(), isStaff);
        return ResponseEntity.ok(account);
    }

    @PatchMapping("/{accountId}/controls")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Update account controls and preferences", description = "Allows the owning customer to update account preferences such as nickname")
    public ResponseEntity<AccountDto> updateAccountControls(
            @PathVariable UUID accountId,
            @Valid @RequestBody UpdateAccountControlsRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        AccountDto account = accountService.updateAccountControls(accountId, principal.getUserId(), req);
        return ResponseEntity.ok(account);
    }

    @GetMapping("/applications")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "List customer's account applications", description = "Returns historical and active account applications for the authenticated customer")
    public ResponseEntity<List<AccountApplicationDto>> getMyApplications(@AuthenticationPrincipal UserPrincipal principal) {
        List<AccountApplicationDto> applications = accountService.getCustomerApplications(principal.getUserId());
        return ResponseEntity.ok(applications);
    }
}
