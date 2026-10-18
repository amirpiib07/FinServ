package com.finserv.modules.deposit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record BookFixedDepositRequest(
        @NotNull(message = "Source account ID is required")
        UUID sourceAccountId,

        @NotNull(message = "Principal amount is required")
        @DecimalMin(value = "1000.00", message = "Minimum Fixed Deposit amount is ₹1,000.00")
        BigDecimal principalAmount,

        @NotNull(message = "Tenure in months is required")
        Integer tenureMonths
) {}
