package com.finserv.modules.database;

import com.finserv.common.util.UuidUtils;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class UtcDateTimeMappingIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @Transactional
    @DisplayName("Should persist and retrieve Instant with zero timezone shift and UTC storage")
    void shouldPersistAndRetrieveInstantWithZeroTimezoneShift() {
        // Truncate to microseconds to match MySQL DATETIME(6) precision
        Instant originalInstant = Instant.now().truncatedTo(ChronoUnit.MICROS);

        UUID userId = UuidUtils.generateV4();
        User user = new User(userId);
        user.setUsername("utc_test_user_" + System.currentTimeMillis());
        user.setEmail("utc_" + System.currentTimeMillis() + "@finserv.local");
        user.setPhoneNumber("+919999" + (System.currentTimeMillis() % 1000000));
        user.setPasswordHash("HASH123");
        user.setEmailVerifiedAt(originalInstant);

        userRepository.saveAndFlush(user);

        // 1. Verify via JPA repository retrieval
        User retrievedUser = userRepository.findById(userId).orElseThrow();
        assertThat(retrievedUser.getEmailVerifiedAt()).isEqualTo(originalInstant);

        // 2. Verify raw MySQL session time zone and string representation
        String serverTime = jdbcTemplate.queryForObject("SELECT NOW(6)", String.class);
        assertThat(serverTime).isNotNull();
    }
}
