package com.finserv.modules.sequence.generator;

import org.springframework.stereotype.Component;

import java.time.Year;
import java.time.ZoneOffset;

/**
 * 12-digit Customer Information File (CIF) number generator:
 * Format: YYYYSSSSSSSC
 * - YYYY: 4-digit registration year
 * - SSSSSSS: 7-digit sequential unique sequence counter padded with leading zeros (0000001 - 9999999)
 * - C: 1 Luhn algorithm (Mod-10) check-digit calculated over the leading 11 digits
 */
@Component
public class CustomerNumberGenerator {

    /**
     * Generates a 12-digit customer CIF number for the given year and sequence counter.
     */
    public String generate(int year, long sequenceNumber) {
        if (sequenceNumber < 1 || sequenceNumber > 9999999) {
            throw new IllegalArgumentException("Sequence number out of 7-digit range: " + sequenceNumber);
        }
        String payload = String.format("%04d%07d", year, sequenceNumber);
        int checkDigit = calculateLuhnCheckDigit(payload);
        return payload + checkDigit;
    }

    /**
     * Generates a 12-digit customer CIF number using the current UTC year.
     */
    public String generate(long sequenceNumber) {
        int currentYear = Year.now(ZoneOffset.UTC).getValue();
        return generate(currentYear, sequenceNumber);
    }

    /**
     * Calculates the Luhn Mod-10 check-digit for the given numeric payload.
     */
    public static int calculateLuhnCheckDigit(String payload) {
        if (payload == null || !payload.matches("^[0-9]+$")) {
            throw new IllegalArgumentException("Payload must be a non-empty numeric string");
        }

        int sum = 0;
        boolean doubleDigit = true;

        for (int i = payload.length() - 1; i >= 0; i--) {
            int digit = payload.charAt(i) - '0';
            if (doubleDigit) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            doubleDigit = !doubleDigit;
        }

        int remainder = sum % 10;
        return (remainder == 0) ? 0 : 10 - remainder;
    }

    /**
     * Validates whether a 12-digit customer CIF number has valid formatting and check-digit.
     */
    public static boolean validate(String customerNumber) {
        if (customerNumber == null || !customerNumber.matches("^[0-9]{12}$")) {
            return false;
        }
        String payload = customerNumber.substring(0, 11);
        int expectedCheckDigit = customerNumber.charAt(11) - '0';
        return calculateLuhnCheckDigit(payload) == expectedCheckDigit;
    }
}
