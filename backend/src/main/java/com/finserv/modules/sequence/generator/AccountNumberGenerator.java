package com.finserv.modules.sequence.generator;

import org.springframework.stereotype.Component;

/**
 * 14-digit Account Number generator:
 * Format: BBBBPPSSSSSSSC
 * - BBBB: 4-digit numeric branch identification code matching branches.branch_code (e.g. 1001)
 * - PP: 2-digit numeric product code matching account_products.product_code (01, 02, 03, 04)
 * - SSSSSSS: 7-digit sequential unique account counter padded with leading zeros (0000001 - 9999999)
 * - C: 1 check-digit calculated using ISO 7064 Mod 11,10 algorithm (single digit 0-9)
 */
@Component
public class AccountNumberGenerator {

    /**
     * Generates a 14-digit account number.
     *
     * @param branchCode 4-digit branch code (e.g. "1001")
     * @param productCode 2-digit product code (e.g. "01")
     * @param sequenceNumber 7-digit sequence number (1 - 9999999)
     * @return complete 14-digit account number
     */
    public String generate(String branchCode, String productCode, long sequenceNumber) {
        if (branchCode == null || !branchCode.matches("^[0-9]{4}$")) {
            throw new IllegalArgumentException("Branch code must be a 4-digit numeric string: " + branchCode);
        }
        if (productCode == null || !productCode.matches("^[0-9]{2}$")) {
            throw new IllegalArgumentException("Product code must be a 2-digit numeric string: " + productCode);
        }
        if (sequenceNumber < 1 || sequenceNumber > 9999999) {
            throw new IllegalArgumentException("Sequence number out of 7-digit range: " + sequenceNumber);
        }

        String payload = String.format("%s%s%07d", branchCode, productCode, sequenceNumber);
        int checkDigit = calculateIso7064Mod11_10CheckDigit(payload);
        return payload + checkDigit;
    }

    /**
     * Calculates the single-digit ISO 7064 Mod 11,10 check-digit over a numeric payload.
     * Guarantees 0 <= C <= 9 and detects 100% of single substitutions and adjacent transpositions.
     */
    public static int calculateIso7064Mod11_10CheckDigit(String payload) {
        if (payload == null || !payload.matches("^[0-9]+$")) {
            throw new IllegalArgumentException("Payload must be a non-empty numeric string");
        }

        int p = 10;
        for (int i = 0; i < payload.length(); i++) {
            int digit = payload.charAt(i) - '0';
            int s = (p + digit) % 10;
            if (s == 0) {
                s = 10;
            }
            p = (s * 2) % 11;
        }

        return (11 - p) % 10;
    }

    /**
     * Validates whether a 14-digit account number has valid structure and ISO 7064 Mod 11,10 check digit.
     */
    public static boolean validate(String accountNumber) {
        if (accountNumber == null || !accountNumber.matches("^[0-9]{14}$")) {
            return false;
        }
        String payload = accountNumber.substring(0, 13);
        int expectedCheckDigit = accountNumber.charAt(13) - '0';
        return calculateIso7064Mod11_10CheckDigit(payload) == expectedCheckDigit;
    }
}
