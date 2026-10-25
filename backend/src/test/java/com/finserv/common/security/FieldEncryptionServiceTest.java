package com.finserv.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FieldEncryptionServiceTest {

    private FieldEncryptionService encryptionService;

    @BeforeEach
    void setUp() {
        encryptionService = new FieldEncryptionService();
        ReflectionTestUtils.setField(encryptionService, "configuredKey", HexFormat.of().formatHex(new byte[32]));
        encryptionService.init();
    }

    @Test
    @DisplayName("Should successfully encrypt and decrypt string using AES-256-GCM")
    void shouldEncryptAndDecryptSuccessfully() {
        String original = "CONFIDENTIAL_TAX_PAN_ABCDE1234F";
        String encrypted = encryptionService.encrypt(original);

        assertThat(encrypted).isNotNull();
        assertThat(encrypted).isNotEqualTo(original);

        String decrypted = encryptionService.decrypt(encrypted);
        assertThat(decrypted).isEqualTo(original);
    }

    @Test
    @DisplayName("Should use random IV for distinct ciphertexts on identical plaintexts")
    void shouldGenerateDistinctCiphertextsForIdenticalPlaintexts() {
        String original = "SECRET_DOCUMENT_987654";
        String encrypted1 = encryptionService.encrypt(original);
        String encrypted2 = encryptionService.encrypt(original);

        assertThat(encrypted1).isNotEqualTo(encrypted2);
        assertThat(encryptionService.decrypt(encrypted1)).isEqualTo(original);
        assertThat(encryptionService.decrypt(encrypted2)).isEqualTo(original);
    }

    @Test
    @DisplayName("Should fail decryption when ciphertext or auth tag is tampered")
    void shouldFailDecryptionOnTamperedCiphertext() {
        String original = "TAMPER_TEST_DATA";
        String encrypted = encryptionService.encrypt(original);

        // Tamper with one base64 character in the middle
        char[] chars = encrypted.toCharArray();
        chars[15] = (chars[15] == 'A') ? 'B' : 'A';
        String tampered = new String(chars);

        assertThatThrownBy(() -> encryptionService.decrypt(tampered))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("Should compute deterministic 64-char hex blind index HMAC-SHA256")
    void shouldComputeDeterministicBlindIndex() {
        String pan1 = "abcde1234f";
        String pan2 = "ABCDE1234F "; // Case & whitespace variation

        String hash1 = encryptionService.computeBlindIndex(pan1);
        String hash2 = encryptionService.computeBlindIndex(pan2);

        assertThat(hash1).hasSize(64);
        assertThat(hash1).matches("^[a-f0-9]{64}$");
        assertThat(hash1).isEqualTo(hash2); // Deterministic normalized match
    }

    @Test
    @DisplayName("Should fail fast in every profile if key is missing")
    void shouldFailFastIfKeyMissing() {
        FieldEncryptionService service = new FieldEncryptionService();

        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_ENCRYPTION_KEY is required");
    }

    @Test
    @DisplayName("Should reject invalid encryption keys instead of falling back")
    void shouldRejectInvalidKey() {
        FieldEncryptionService service = new FieldEncryptionService();
        ReflectionTestUtils.setField(service, "configuredKey", "invalid");

        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid APP_ENCRYPTION_KEY");
    }
}
