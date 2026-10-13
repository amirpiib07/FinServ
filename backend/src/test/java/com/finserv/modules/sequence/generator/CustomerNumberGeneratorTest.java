package com.finserv.modules.sequence.generator;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CustomerNumberGeneratorTest {

    private final CustomerNumberGenerator generator = new CustomerNumberGenerator();

    @Test
    @DisplayName("Should generate valid 12-digit customer CIF number")
    void shouldGenerateValidCustomerNumber() {
        String cif = generator.generate(2026, 1L);
        assertThat(cif).hasSize(12);
        assertThat(cif).startsWith("20260000001");
        assertThat(CustomerNumberGenerator.validate(cif)).isTrue();
    }

    @Test
    @DisplayName("Should verify known Luhn vectors")
    void shouldVerifyKnownLuhnVectors() {
        // Test vector: payload "20260000001"
        int checkDigit = CustomerNumberGenerator.calculateLuhnCheckDigit("20260000001");
        String full = "20260000001" + checkDigit;
        assertThat(CustomerNumberGenerator.validate(full)).isTrue();

        // Standard credit-card style test vectors for Luhn algorithm
        // Payload "7992739871" -> Luhn check digit is 3
        assertThat(CustomerNumberGenerator.calculateLuhnCheckDigit("7992739871")).isEqualTo(3);
    }

    @Test
    @DisplayName("Should detect single-digit mutation and transposition errors")
    void shouldDetectMutationsAndTranspositions() {
        String validCif = generator.generate(2026, 42L);
        assertThat(CustomerNumberGenerator.validate(validCif)).isTrue();

        // 1. Single-digit mutation: change last payload digit
        char[] chars = validCif.toCharArray();
        chars[10] = (chars[10] == '9') ? '0' : (char) (chars[10] + 1);
        String mutated = new String(chars);
        assertThat(CustomerNumberGenerator.validate(mutated)).isFalse();

        // 2. Adjacent transposition mutation: swap chars at index 0 and 1
        char[] transposed = validCif.toCharArray();
        char temp = transposed[0];
        transposed[0] = transposed[1];
        transposed[1] = temp;
        String transposedCif = new String(transposed);
        if (!transposedCif.equals(validCif)) {
            assertThat(CustomerNumberGenerator.validate(transposedCif)).isFalse();
        }
    }

    @Test
    @DisplayName("Should reject sequence numbers outside 7-digit bounds")
    void shouldRejectInvalidSequences() {
        assertThatThrownBy(() -> generator.generate(2026, 0L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> generator.generate(2026, 10000000L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
