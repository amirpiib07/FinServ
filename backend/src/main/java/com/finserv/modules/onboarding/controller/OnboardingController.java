package com.finserv.modules.onboarding.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.onboarding.dto.OnboardingApplicationDto;
import com.finserv.modules.onboarding.dto.SaveStepRequest;
import com.finserv.modules.onboarding.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/onboarding")
@Tag(name = "Customer Onboarding & KYC", description = "Endpoints for multi-step progressive onboarding and KYC submission")
@SecurityRequirement(name = "bearerAuth")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/application")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get or initialize open onboarding application", description = "Fetches or creates a draft onboarding application with decrypted step data for the current user")
    public ResponseEntity<OnboardingApplicationDto> getApplication(@AuthenticationPrincipal UserPrincipal principal) {
        OnboardingApplicationDto app = onboardingService.getOrCreateApplication(principal.getUserId());
        return ResponseEntity.ok(app);
    }

    @PutMapping("/application/step/{step}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Save onboarding step progress", description = "Saves step data encrypted in draft and advances current step index")
    public ResponseEntity<OnboardingApplicationDto> saveStep(
            @PathVariable int step,
            @Valid @RequestBody SaveStepRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        OnboardingApplicationDto app = onboardingService.saveStep(principal.getUserId(), step, req.getStepData());
        return ResponseEntity.ok(app);
    }

    @PostMapping("/application/submit")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Submit onboarding application for verification", description = "Validates all steps, checks for duplicate PAN blind index, links addresses, declarations and KYC documents, and sets status to SUBMITTED")
    public ResponseEntity<OnboardingApplicationDto> submitApplication(
            HttpServletRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        OnboardingApplicationDto app = onboardingService.submitApplication(principal.getUserId(), ipAddress, userAgent);
        return ResponseEntity.ok(app);
    }
}
