package com.finserv.modules.card.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record UpdateCardControlsRequest(
        String status,
        Boolean onlineTransactionsEnabled,
        Boolean contactlessEnabled,
        Boolean internationalEnabled,

        @DecimalMin(value = "0.00", message = "Daily spend limit cannot be negative")
        BigDecimal dailySpendLimit
) {}
