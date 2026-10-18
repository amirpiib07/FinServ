package com.finserv.modules.dashboard.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.dashboard.dto.CustomerDashboardDto;
import com.finserv.modules.dashboard.service.CustomerDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Customer Dashboard", description = "Aggregated customer financial dashboard endpoints")
public class CustomerDashboardController {

    private final CustomerDashboardService customerDashboardService;

    public CustomerDashboardController(CustomerDashboardService customerDashboardService) {
        this.customerDashboardService = customerDashboardService;
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get aggregated customer dashboard", description = "Returns total net worth, active accounts, 30-day cashflow summary, top beneficiaries, and alerts.")
    public ResponseEntity<CustomerDashboardDto> getCustomerDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        CustomerDashboardDto dashboard = customerDashboardService.getCustomerDashboard(principal.getUserId());
        return ResponseEntity.ok(dashboard);
    }
}
