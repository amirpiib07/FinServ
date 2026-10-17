package com.finserv.modules.ledger.service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Immutable posting instruction for a single leg of a balanced GL entry.
 */
public record PostingInstruction(
        UUID glAccountId,
        UUID customerAccountId,
        String entryType, // "DEBIT" or "CREDIT"
        BigDecimal amount
) {
    public PostingInstruction {
        if (glAccountId == null) {
            throw new IllegalArgumentException("GL Account ID cannot be null");
        }
        if (entryType == null || (!entryType.equals("DEBIT") && !entryType.equals("CREDIT"))) {
            throw new IllegalArgumentException("Entry type must be DEBIT or CREDIT");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Posting amount must be strictly positive");
        }
    }
}
