package com.finserv.modules.account.controller;

import com.finserv.modules.account.dto.AccountProductDto;
import com.finserv.modules.account.service.AccountService;
import com.finserv.modules.organization.dto.BranchDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Products & Branches", description = "Endpoints for available banking account products and active branches")
@SecurityRequirement(name = "bearerAuth")
public class ProductAndBranchController {

    private final AccountService accountService;

    public ProductAndBranchController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/products/accounts")
    @Operation(summary = "List active account products", description = "Returns active savings and current account products with interest rates and minimum balances")
    public ResponseEntity<List<AccountProductDto>> getAccountProducts() {
        return ResponseEntity.ok(accountService.getActiveAccountProducts());
    }

    @GetMapping("/branches")
    @Operation(summary = "List active bank branches", description = "Returns active bank branches with branch codes, IFSC codes, and addresses")
    public ResponseEntity<List<BranchDto>> getBranches() {
        return ResponseEntity.ok(accountService.getActiveBranches());
    }
}
