package com.finserv.common.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Enterprise field-level encryption service using authenticated AES-256-GCM with blind-indexing.
 * Master key sourced exclusively from APP_ENCRYPTION_KEY environment variable.
 * Never logs, prints, or exposes the master key.
 */
@Service
public class FieldEncryptionService {

    private static final String ALGORITHM = "AES";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${finserv.security.encryption-key:}")
    private String configuredKey;

    private byte[] masterKeyBytes;

    @PostConstruct
    public void init() {
        if (configuredKey == null || configuredKey.isBlank()) {
            throw new IllegalStateException("APP_ENCRYPTION_KEY is required in every profile.");
        }

        try {
            if (configuredKey.length() == 64) {
                this.masterKeyBytes = HexFormat.of().parseHex(configuredKey);
            } else if (configuredKey.length() == 32) {
                this.masterKeyBytes = configuredKey.getBytes(StandardCharsets.UTF_8);
            } else {
                byte[] decoded = Base64.getDecoder().decode(configuredKey);
                if (decoded.length == 32) {
                    this.masterKeyBytes = decoded;
                } else {
                    throw new IllegalArgumentException("Invalid key length: must be 256 bits (32 bytes / 64 hex chars)");
                }
            }
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(
                    "Invalid APP_ENCRYPTION_KEY. Configure a 256-bit key (32 bytes).", ex);
        }
    }

    /**
     * Encrypts plaintext string using AES-256-GCM with a fresh 12-byte IV.
     * Returns a Base64-encoded string: [IV (12 bytes) + Ciphertext + GCM Tag (16 bytes)].
     */
    public String encrypt(String plainText) {
        if (plainText == null) {
            return null;
        }

        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            SecretKey secretKey = new SecretKeySpec(masterKeyBytes, ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherTextWithTag = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherTextWithTag.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherTextWithTag);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    /**
     * Decrypts a Base64-encoded AES-256-GCM payload.
     */
    public String decrypt(String cipherTextBase64) {
        if (cipherTextBase64 == null) {
            return null;
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(cipherTextBase64);
            if (decoded.length < GCM_IV_LENGTH_BYTES) {
                throw new IllegalArgumentException("Invalid ciphertext payload: missing IV");
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            byteBuffer.get(iv);

            byte[] cipherTextWithTag = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherTextWithTag);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            SecretKey secretKey = new SecretKeySpec(masterKeyBytes, ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainBytes = cipher.doFinal(cipherTextWithTag);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt data", e);
        }
    }

    /**
     * Computes a deterministic HMAC-SHA256 blind index hash for exact-match searching on sensitive fields.
     * Normalized by trimming and uppercasing. Returns 64-character lowercase hexadecimal hash.
     */
    public String computeBlindIndex(String plainText) {
        if (plainText == null) {
            return null;
        }

        try {
            String normalized = plainText.trim().toUpperCase();
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKey secretKey = new SecretKeySpec(masterKeyBytes, HMAC_ALGORITHM);
            mac.init(secretKey);
            byte[] hashBytes = mac.doFinal(normalized.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute blind index", e);
        }
    }
}
