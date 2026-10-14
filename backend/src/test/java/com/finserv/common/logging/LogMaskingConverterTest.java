package com.finserv.common.logging;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LogMaskingConverterTest {

    private final LogMaskingConverter converter = new LogMaskingConverter();

    @Test
    @DisplayName("Should mask password and token in JSON payload")
    void shouldMaskJsonSensitiveFields() {
        String input = "User registration: {\"username\":\"john\",\"password\":\"SecretPassword123!\",\"email\":\"john@test.com\"}";
        String masked = converter.mask(input);

        assertThat(masked).doesNotContain("SecretPassword123!");
        assertThat(masked).contains("\"password\":\"***MASKED***\"");
        assertThat(masked).contains("\"username\":\"john\"");
    }

    @Test
    @DisplayName("Should mask key-value credentials in log messages")
    void shouldMaskKeyValueSensitiveFields() {
        String input = "Authentication attempt with username=admin, password=SuperSecretPassword, ip=127.0.0.1";
        String masked = converter.mask(input);

        assertThat(masked).doesNotContain("SuperSecretPassword");
        assertThat(masked).contains("password=***MASKED***");
    }

    @Test
    @DisplayName("Should mask PAN and tax identifier fields")
    void shouldMaskTaxIdentifierAndPan() {
        String input = "KYC verified: {\"pan\":\"ABCDE1234F\",\"tax_identifier\":\"TAX987654321\"}";
        String masked = converter.mask(input);

        assertThat(masked).doesNotContain("ABCDE1234F");
        assertThat(masked).doesNotContain("TAX987654321");
        assertThat(masked).contains("\"pan\":\"***MASKED***\"");
        assertThat(masked).contains("\"tax_identifier\":\"***MASKED***\"");
    }
}
