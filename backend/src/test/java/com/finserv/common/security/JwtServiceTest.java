package com.finserv.common.security;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    @Test
    void rejectsMissingSigningSecret() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "jwtSecret", "");

        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must be configured");
    }

    @Test
    void rejectsSigningSecretShorterThan256Bits() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "jwtSecret", "too-short");

        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 UTF-8 bytes");
    }

    @Test
    void validatesTokensSignedWithConfiguredSecret() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "jwtSecret", "test-only-signing-key-with-32-bytes-minimum");
        ReflectionTestUtils.setField(service, "accessTokenExpirationMinutes", 15L);
        service.init();

        UUID userId = UUID.randomUUID();
        String token = service.generateAccessToken(userId, "test-user", List.of("ROLE_CUSTOMER"));

        assertThat(service.validateToken(token)).isTrue();
        assertThat(service.extractUserId(token)).isEqualTo(userId);
        assertThat(service.extractRoles(token)).containsExactly("ROLE_CUSTOMER");
    }
}
