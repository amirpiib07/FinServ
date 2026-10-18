package com.finserv.modules.deposit.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FixedDepositDto(
        UUID id,
        String depositNumber,
        UUID customerId,
        UUID sourceAccountId,
        String sourceAccountNumber,
        BigDecimal principalAmount,
        BigDecimal interestRatePercentage,
        Integer tenureMonths,
        BigDecimal maturityAmount,
        BigDecimal interestEarned,
        String status,
        Instant startDate,
        Instant maturityDate,
        Instant createdAt
) {}
