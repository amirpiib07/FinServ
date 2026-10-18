package com.finserv.modules.card.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record VirtualCardDto(
        UUID id,
        UUID accountId,
        String accountNumber,
        UUID customerId,
        String cardNumberMasked,
        String cardNumberLast4,
        String cardNetwork,
        String cardType,
        String cardholderName,
        int expiryMonth,
        int expiryYear,
        String status,
        boolean onlineTransactionsEnabled,
        boolean contactlessEnabled,
        boolean internationalEnabled,
        BigDecimal dailySpendLimit
) {}
