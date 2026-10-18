package com.finserv.modules.admin.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.admin.dto.*;
import com.finserv.modules.admin.service.AdminService;
import com.finserv.modules.organization.dto.BranchDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Command Center", description = "Operations and administrative management portal endpoints")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // 1. Executive Admin Overview
    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get system operational KPIs and GL health")
    public ResponseEntity<AdminOverviewDto> getOverview() {
        return ResponseEntity.ok(adminService.getOverview());
    }

    // 2. KYC Applications Queue
    @GetMapping("/kyc/applications")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List onboarding KYC applications for officer review")
    public ResponseEntity<List<KycApplicationReviewDto>> getKycApplications(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getKycApplications(status, search));
    }

    @PostMapping("/kyc/applications/{id}/decide")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Approve or reject customer onboarding KYC application")
    public ResponseEntity<KycApplicationReviewDto> decideKycApplication(
            @PathVariable UUID id,
            @Valid @RequestBody KycDecisionRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String role = principal.getAuthorities().isEmpty() ? "ROLE_ADMIN" : principal.getAuthorities().iterator().next().getAuthority();
        KycApplicationReviewDto result = adminService.decideKycApplication(
                id, req, principal.getUserId(), role, request.getRemoteAddr(), request.getHeader("User-Agent")
        );
        return ResponseEntity.ok(result);
    }

    // 3. Accounts Directory & Status Control
    @GetMapping("/accounts")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Directory of all bank accounts with status filters")
    public ResponseEntity<AdminPageResponse<AdminAccountSummaryDto>> getAccounts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(adminService.getAccounts(status, search, page, size));
    }

    @PatchMapping("/accounts/{id}/status")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Freeze or unfreeze bank account with audit reason")
    public ResponseEntity<AdminAccountSummaryDto> updateAccountStatus(
            @PathVariable UUID id,
            @Valid @RequestBody AccountStatusUpdateRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String role = principal.getAuthorities().isEmpty() ? "ROLE_ADMIN" : principal.getAuthorities().iterator().next().getAuthority();
        AdminAccountSummaryDto result = adminService.updateAccountStatus(
                id, req, principal.getUserId(), role, request.getRemoteAddr(), request.getHeader("User-Agent")
        );
        return ResponseEntity.ok(result);
    }

    // 4. Account Applications
    @GetMapping("/account-applications")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List customer account opening applications")
    public ResponseEntity<List<AdminAccountApplicationDto>> getAccountApplications(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.getAccountApplications(status));
    }

    @PostMapping("/account-applications/{id}/decide")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Approve or reject account opening application")
    public ResponseEntity<AdminAccountApplicationDto> decideAccountApplication(
            @PathVariable UUID id,
            @Valid @RequestBody AccountApplicationDecisionRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String role = principal.getAuthorities().isEmpty() ? "ROLE_ADMIN" : principal.getAuthorities().iterator().next().getAuthority();
        AdminAccountApplicationDto result = adminService.decideAccountApplication(
                id, req, principal.getUserId(), role, request.getRemoteAddr(), request.getHeader("User-Agent")
        );
        return ResponseEntity.ok(result);
    }

    // 5. Branches Management
    @GetMapping("/branches")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all bank branches")
    public ResponseEntity<List<BranchDto>> getBranches() {
        return ResponseEntity.ok(adminService.getBranches());
    }

    @PostMapping("/branches")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Super Admin: Create a new bank branch")
    public ResponseEntity<BranchDto> createBranch(
            @Valid @RequestBody CreateBranchRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String role = principal.getAuthorities().isEmpty() ? "ROLE_SUPER_ADMIN" : principal.getAuthorities().iterator().next().getAuthority();
        BranchDto result = adminService.createBranch(
                req, principal.getUserId(), role, request.getRemoteAddr(), request.getHeader("User-Agent")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // 6. Staff User Management
    @GetMapping("/staff")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Super Admin: List all bank officers and employee users")
    public ResponseEntity<List<StaffUserDto>> getStaffUsers() {
        return ResponseEntity.ok(adminService.getStaffUsers());
    }

    @PostMapping("/staff")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Super Admin: Provision a new bank employee or admin user")
    public ResponseEntity<StaffUserDto> createStaffUser(
            @Valid @RequestBody CreateStaffRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {
        String role = principal.getAuthorities().isEmpty() ? "ROLE_SUPER_ADMIN" : principal.getAuthorities().iterator().next().getAuthority();
        StaffUserDto result = adminService.createStaffUser(
                req, principal.getUserId(), role, request.getRemoteAddr(), request.getHeader("User-Agent")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // 7. General Ledger Trial Balance
    @GetMapping("/ledger/summary")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Super Admin: Double-Entry General Ledger Trial Balance viewer")
    public ResponseEntity<GlTrialBalanceDto> getGlTrialBalance() {
        return ResponseEntity.ok(adminService.getGlTrialBalance());
    }

    // 8. Tamper-Evident SHA-256 Audit Trail
    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Super Admin: Cryptographic audit log trail viewer")
    public ResponseEntity<AdminPageResponse<AdminAuditLogDto>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID actorUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAuditLogs(action, entityType, actorUserId, page, size));
    }
}
