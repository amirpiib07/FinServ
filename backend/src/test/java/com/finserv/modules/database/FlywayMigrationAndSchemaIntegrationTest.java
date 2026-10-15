package com.finserv.modules.database;

import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.GlChartOfAccountRepository;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.organization.repository.BranchRepository;
import com.finserv.modules.sequence.repository.NumberSequenceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationAndSchemaIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GlChartOfAccountRepository glChartOfAccountRepository;

    @Autowired
    private AccountProductRepository accountProductRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private NumberSequenceRepository numberSequenceRepository;

    private static final List<String> EXPECTED_CORE_TABLES = List.of(
            // V1_1 (5 tables)
            "roles", "users", "user_roles", "refresh_tokens", "otp_challenges",
            // V1_2 (5 tables)
            "onboarding_applications", "customers", "customer_declarations", "addresses", "kyc_documents",
            // V1_3 (2 tables)
            "branches", "employees",
            // V1_4 (5 tables)
            "gl_chart_of_accounts", "account_products", "accounts", "account_applications", "account_holds",
            // V1_5 (2 tables)
            "gl_journal_entries", "gl_ledger_postings",
            // V1_6 (2 tables)
            "idempotency_records", "transactions",
            // V1_7 (3 tables)
            "approval_requests", "number_sequences", "audit_logs"
    );

    @Test
    @DisplayName("Should verify exactly 24 core tables plus Flyway history exist in database")
    void shouldVerifyAll24CoreTablesExist() {
        List<String> tableNames = jdbcTemplate.queryForList(
                "SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'",
                String.class
        ).stream().map(String::toLowerCase).toList();

        // 24 core tables + flyway_schema_history = 25 total
        assertThat(tableNames).contains("flyway_schema_history");
        for (String expectedTable : EXPECTED_CORE_TABLES) {
            assertThat(tableNames).as("Table '%s' must exist", expectedTable).contains(expectedTable);
        }
        assertThat(EXPECTED_CORE_TABLES).hasSize(24);
    }

    @Test
    @DisplayName("Should verify V2 seed reference data present in database")
    void shouldVerifyV2SeedDataPresent() {
        // 1. Roles (5 roles)
        assertThat(roleRepository.count()).isEqualTo(5L);
        assertThat(roleRepository.findByName("ROLE_CUSTOMER")).isPresent();
        assertThat(roleRepository.findByName("ROLE_EMPLOYEE")).isPresent();
        assertThat(roleRepository.findByName("ROLE_MANAGER")).isPresent();
        assertThat(roleRepository.findByName("ROLE_ADMIN")).isPresent();
        assertThat(roleRepository.findByName("ROLE_COMPLIANCE")).isPresent();

        // 2. SYSTEM_INTERNAL Daemon User
        UUID systemUserId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        var systemUserOpt = userRepository.findById(systemUserId);
        assertThat(systemUserOpt).isPresent();
        var systemUser = systemUserOpt.get();
        assertThat(systemUser.getUsername()).isEqualTo("SYSTEM_INTERNAL");
        assertThat(systemUser.isSystem()).isTrue();
        assertThat(systemUser.getPasswordHash()).isEqualTo("*LOCKED*");
        assertThat(systemUser.getStatus()).isEqualTo("ACTIVE");

        // 3. 10 General Ledger accounts
        assertThat(glChartOfAccountRepository.count()).isEqualTo(10L);
        assertThat(glChartOfAccountRepository.findByGlCode("10100")).isPresent();
        assertThat(glChartOfAccountRepository.findByGlCode("20100")).isPresent();
        assertThat(glChartOfAccountRepository.findByGlCode("50100")).isPresent();

        // 4. 4 Account Products
        assertThat(accountProductRepository.count()).isEqualTo(4L);
        assertThat(accountProductRepository.findByProductCode("01")).isPresent();
        assertThat(accountProductRepository.findByProductCode("02")).isPresent();
        assertThat(accountProductRepository.findByProductCode("03")).isPresent();
        assertThat(accountProductRepository.findByProductCode("04")).isPresent();

        // 5. Head-Office Branch 1001
        assertThat(branchRepository.findByBranchCode("1001")).isPresent();
        assertThat(branchRepository.findByIfscCode("FINS0001001")).isPresent();

        // 6. Number sequences baseline
        assertThat(numberSequenceRepository.existsById("account_num_seq")).isTrue();
        assertThat(numberSequenceRepository.existsById("customer_cif_seq_2026")).isTrue();
        assertThat(numberSequenceRepository.existsById("audit_chain_seq")).isTrue();
    }
}
