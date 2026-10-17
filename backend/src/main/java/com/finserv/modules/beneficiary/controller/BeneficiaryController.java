package com.finserv.modules.beneficiary.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.beneficiary.dto.BeneficiaryDto;
import com.finserv.modules.beneficiary.dto.CreateBeneficiaryRequest;
import com.finserv.modules.beneficiary.dto.VerifyBeneficiaryRequest;
import com.finserv.modules.beneficiary.service.BeneficiaryService;
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
@RequestMapping("/api/v1/beneficiaries")
@Tag(name = "Beneficiary Management", description = "Endpoints for intra-bank and inter-bank payee/beneficiary management")
@SecurityRequirement(name = "bearerAuth")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    public BeneficiaryController(BeneficiaryService beneficiaryService) {
        this.beneficiaryService = beneficiaryService;
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "List customer beneficiaries", description = "Returns active beneficiaries registered by the authenticated customer")
    public ResponseEntity<List<BeneficiaryDto>> getBeneficiaries(@AuthenticationPrincipal UserPrincipal principal) {
        List<BeneficiaryDto> beneficiaries = beneficiaryService.getCustomerBeneficiaries(principal.getUserId());
        return ResponseEntity.ok(beneficiaries);
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Add a new beneficiary", description = "Registers a new beneficiary in PENDING_VERIFICATION state after validating account and IFSC")
    public ResponseEntity<BeneficiaryDto> addBeneficiary(
            @Valid @RequestBody CreateBeneficiaryRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        BeneficiaryDto beneficiary = beneficiaryService.addBeneficiary(principal.getUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(beneficiary);
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Verify pending beneficiary", description = "Verifies a pending beneficiary with an OTP code, enabling fund transfers")
    public ResponseEntity<BeneficiaryDto> verifyBeneficiary(
            @PathVariable UUID id,
            @Valid @RequestBody VerifyBeneficiaryRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        BeneficiaryDto beneficiary = beneficiaryService.verifyBeneficiary(id, principal.getUserId(), req);
        return ResponseEntity.ok(beneficiary);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Delete beneficiary", description = "Soft deletes and deactivates an existing beneficiary")
    public ResponseEntity<Void> deleteBeneficiary(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        beneficiaryService.deleteBeneficiary(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }
}
