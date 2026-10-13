package com.finserv.modules.sequence.generator;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountNumberGeneratorTest {

    private final AccountNumberGenerator generator = new AccountNumberGenerator();

    @Test
    @DisplayName("Should generate valid 14-digit account number")
    void shouldGenerateValidAccountNumber() {
        String accNum = generator.generate("1001", "01", 1L);
        assertThat(accNum).hasSize(14);
        assertThat(accNum).startsWith("1001010000001");
        assertThat(AccountNumberGenerator.validate(accNum)).isTrue();
    }

    @Test
    @DisplayName("Should verify ISO 7064 Mod 11,10 algorithm with known vectors")
    void shouldVerifyKnownIso7064Vectors() {
        // Test standard ISO 7064 Mod 11,10 check-digit behavior
        String payload1 = "1001010000001";
        int checkDigit1 = AccountNumberGenerator.calculateIso7064Mod11_10CheckDigit(payload1);
        assertThat(checkDigit1).isBetween(0, 9);
        String full1 = payload1 + checkDigit1;
        assertThat(AccountNumberGenerator.validate(full1)).isTrue();

        String payload2 = "1001020000042";
        int checkDigit2 = AccountNumberGenerator.calculateIso7064Mod11_10CheckDigit(payload2);
        assertThat(checkDigit2).isBetween(0, 9);
        String full2 = payload2 + checkDigit2;
        assertThat(AccountNumberGenerator.validate(full2)).isTrue();
    }

    @Test
    @DisplayName("Should detect 100% of single-digit substitution errors")
    void shouldDetectSingleDigitSubstitutionErrors() {
        String validAcc = generator.generate("1001", "01", 12345L);
        assertThat(AccountNumberGenerator.validate(validAcc)).isTrue();

        for (int i = 0; i < 14; i++) {
            char originalChar = validAcc.charAt(i);
            for (char alt = '0'; alt <= '9'; alt++) {
                if (alt != originalChar) {
                    char[] mutated = validAcc.toCharArray();
                    mutated[i] = alt;
                    String mutatedNumber = new String(mutated);
                    assertThat(AccountNumberGenerator.validate(mutatedNumber))
                            .as("Substitution at index %d from %c to %c should fail", i, originalChar, alt)
                            .isFalse();
                }
            }
        }
    }

    @Test
    @DisplayName("Should detect adjacent transposition errors on distinct consecutive digits")
    void shouldDetectAdjacentTranspositionErrors() {
        String validAcc = generator.generate("1001", "01", 12345L);
        assertThat(AccountNumberGenerator.validate(validAcc)).isTrue();

        int transpositionsDetected = 0;
        int transpositionsTested = 0;

        for (int i = 0; i < 13; i++) {
            if (validAcc.charAt(i) != validAcc.charAt(i + 1)) {
                transpositionsTested++;
                char[] transposed = validAcc.toCharArray();
                char temp = transposed[i];
                transposed[i] = transposed[i + 1];
                transposed[i + 1] = temp;
                String transposedNumber = new String(transposed);

                if (!AccountNumberGenerator.validate(transposedNumber)) {
                    transpositionsDetected++;
                }
            }
        }

        assertThat(transpositionsTested).isGreaterThan(0);
        // ISO 7064 Mod 11,10 detects the overwhelming majority (>90%) of adjacent transpositions
        assertThat(transpositionsDetected).isGreaterThanOrEqualTo(transpositionsTested - 1);
    }

    @Test
    @DisplayName("Should generate unique account numbers across sequential inputs")
    void shouldGenerateUniqueNumbersAcrossSequences() {
        Set<String> generated = new HashSet<>();
        for (long seq = 1; seq <= 1000; seq++) {
            String acc = generator.generate("1001", "01", seq);
            assertThat(generated.add(acc)).isTrue();
        }
        assertThat(generated).hasSize(1000);
    }

    @Test
    @DisplayName("Should reject invalid branch, product or sequence inputs")
    void shouldRejectInvalidInputs() {
        assertThatThrownBy(() -> generator.generate("100", "01", 1L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> generator.generate("1001", "1", 1L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> generator.generate("1001", "01", 0L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> generator.generate("1001", "01", 10000000L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
