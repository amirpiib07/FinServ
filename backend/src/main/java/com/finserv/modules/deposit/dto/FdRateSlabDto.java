package com.finserv.modules.deposit.dto;

import java.math.BigDecimal;

public record FdRateSlabDto(
        Integer tenureMonths,
        String tenureLabel,
        BigDecimal interestRatePercentage,
        BigDecimal minAmount,
        BigDecimal maxAmount
) {}
