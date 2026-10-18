package com.finserv.modules.card.controller;

import com.finserv.common.security.UserPrincipal;
import com.finserv.modules.card.dto.UpdateCardControlsRequest;
import com.finserv.modules.card.dto.VirtualCardDto;
import com.finserv.modules.card.service.VirtualCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cards")
@Tag(name = "Virtual Cards", description = "FinServ Virtual Platinum Debit Card & Channel Controls APIs")
public class VirtualCardController {

    private final VirtualCardService virtualCardService;

    public VirtualCardController(VirtualCardService virtualCardService) {
        this.virtualCardService = virtualCardService;
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "List or auto-provision virtual debit cards for customer's active accounts")
    public ResponseEntity<List<VirtualCardDto>> getCustomerCards(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(virtualCardService.getCustomerCards(principal.getUserId()));
    }

    @PatchMapping("/{cardId}/controls")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Update card controls: Freeze/Unfreeze, channel toggles, and daily spend limit")
    public ResponseEntity<VirtualCardDto> updateCardControls(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID cardId,
            @Valid @RequestBody UpdateCardControlsRequest request) {
        return ResponseEntity.ok(virtualCardService.updateCardControls(principal.getUserId(), cardId, request));
    }
}
