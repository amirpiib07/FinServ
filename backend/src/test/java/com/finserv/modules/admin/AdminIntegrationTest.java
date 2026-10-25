package com.finserv.modules.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finserv.common.security.JwtService;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.admin.dto.AccountStatusUpdateRequest;
import com.finserv.modules.admin.dto.CreateBranchRequest;
import com.finserv.modules.admin.dto.CreateStaffRequest;
import com.finserv.modules.admin.dto.KycDecisionRequest;
import com.finserv.modules.audit.repository.AuditLogRepository;
import com.finserv.modules.identity.entity.Role;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.entity.UserRole;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.identity.repository.UserRoleRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.entity.OnboardingApplication;
import com.finserv.modules.onboarding.repository.CustomerRepository;
import com.finserv.modules.onboarding.repository.OnboardingApplicationRepository;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.organization.repository.BranchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OnboardingApplicationRepository onboardingApplicationRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AccountProductRepository accountProductRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private com.finserv.modules.onboarding.service.CustomerLookupService customerLookupService;

    private User customerUser;
    private User adminUser;
    private User superAdminUser;
    private String customerToken;
    private String adminToken;
    private String superAdminToken;

    @BeforeEach
    void setUp() {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER").orElseThrow();
        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseThrow();
        Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN").orElseThrow();

        // 1. Customer User
        customerUser = new User();
        customerUser.setUsername("test_cust_" + System.currentTimeMillis());
        customerUser.setEmail("cust_" + System.currentTimeMillis() + "@finserv.local");
        customerUser.setPhoneNumber("+9191" + (long)(Math.random() * 90000000L + 10000000L));
        customerUser.setPasswordHash("hashed_pwd");
        customerUser.setStatus("ACTIVE");
        customerUser = userRepository.save(customerUser);
        userRoleRepository.save(new UserRole(customerUser.getId(), customerRole.getId()));
        customerToken = jwtService.generateAccessToken(customerUser.getId(), customerUser.getUsername(), List.of("ROLE_CUSTOMER"));

        // 2. Admin User
        adminUser = new User();
        adminUser.setUsername("test_admin_" + System.currentTimeMillis());
        adminUser.setEmail("admin_" + System.currentTimeMillis() + "@finserv.local");
        adminUser.setPhoneNumber("+9192" + (long)(Math.random() * 90000000L + 10000000L));
        adminUser.setPasswordHash("hashed_pwd");
        adminUser.setStatus("ACTIVE");
        adminUser = userRepository.save(adminUser);
        userRoleRepository.save(new UserRole(adminUser.getId(), adminRole.getId()));
        adminToken = jwtService.generateAccessToken(adminUser.getId(), adminUser.getUsername(), List.of("ROLE_ADMIN"));

        // 3. Super Admin User
        superAdminUser = new User();
        superAdminUser.setUsername("test_superadmin_" + System.currentTimeMillis());
        superAdminUser.setEmail("superadmin_" + System.currentTimeMillis() + "@finserv.local");
        superAdminUser.setPhoneNumber("+9193" + (long)(Math.random() * 90000000L + 10000000L));
        superAdminUser.setPasswordHash("hashed_pwd");
        superAdminUser.setStatus("ACTIVE");
        superAdminUser = userRepository.save(superAdminUser);
        userRoleRepository.save(new UserRole(superAdminUser.getId(), adminRole.getId()));
        userRoleRepository.save(new UserRole(superAdminUser.getId(), superAdminRole.getId()));
        superAdminToken = jwtService.generateAccessToken(superAdminUser.getId(), superAdminUser.getUsername(), List.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN"));
    }

    @Test
    @DisplayName("Role Security: Customer calling admin endpoints must receive 403 Forbidden")
    void shouldDenyCustomerAccessToAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/kyc/applications")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/accounts")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin Overview: Admin receives system KPIs and GL integrity status")
    void shouldReturnAdminOverview() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCustomers").isNumber())
                .andExpect(jsonPath("$.pendingKycReviewsCount").isNumber())
                .andExpect(jsonPath("$.glBalanced").isBoolean())
                .andExpect(jsonPath("$.glIntegrityStatus").isString());
    }

    @Test
    @DisplayName("KYC Review & Approval: Officer approves submitted KYC onboarding application")
    void shouldApproveKycApplication() throws Exception {
        // Create an onboarding application for customerUser
        OnboardingApplication app = new OnboardingApplication();
        app.setUserId(customerUser.getId());
        app.setApplicationReference("FINS-APP-" + System.currentTimeMillis());
        app.setCurrentStep(4);
        app.setStatus("SUBMITTED");
        app.setSubmittedAt(Instant.now());
        app = onboardingApplicationRepository.save(app);

        KycDecisionRequest request = new KycDecisionRequest("APPROVE", "All KYC documents and PAN verified successfully");

        mockMvc.perform(post("/api/v1/admin/kyc/applications/" + app.getId() + "/decide")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Verify Customer record is VERIFIED
        Customer customer = customerRepository.findByUserId(customerUser.getId()).orElseThrow();
        assertThat(customer.getKycStatus()).isEqualTo("VERIFIED");

        // Verify Audit Log was recorded
        var logs = auditLogRepository.findFilteredAuditLogs("APPROVE", "ONBOARDING_APPLICATION", null, null);
        assertThat(logs.getContent()).isNotEmpty();
        assertThat(logs.getContent().get(0).getCurrentHash()).isNotEmpty();
    }

    @Test
    @DisplayName("Account Freeze and Unfreeze: Officer updates account status with audit recording")
    void shouldFreezeAndUnfreezeAccount() throws Exception {
        Branch branch = branchRepository.findAll().get(0);
        AccountProduct product = accountProductRepository.findAll().get(0);

        Customer customer = customerLookupService.getOrCreateCustomerForUser(customerUser.getId());
        customer.setKycStatus("VERIFIED");
        customer = customerRepository.save(customer);

        Account account = new Account();
        account.setCustomerId(customer.getId());
        account.setBranchId(branch.getId());
        account.setProductId(product.getId());
        account.setAccountNumber("1001" + System.currentTimeMillis() % 10000000000L);
        account.setCurrency("INR");
        account.setStatus("ACTIVE");
        account.setCurrentBalance(new BigDecimal("10000.00"));
        account.setAvailableBalance(new BigDecimal("10000.00"));
        account.setHoldBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        account.setOpenedAt(Instant.now());
        account = accountRepository.save(account);

        // 1. Freeze Account
        AccountStatusUpdateRequest freezeReq = new AccountStatusUpdateRequest("FROZEN", "Suspicious transaction pattern detected by risk team");
        mockMvc.perform(patch("/api/v1/admin/accounts/" + account.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(freezeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FROZEN"));

        // 2. Unfreeze Account
        AccountStatusUpdateRequest unfreezeReq = new AccountStatusUpdateRequest("ACTIVE", "Risk review cleared after verification");
        mockMvc.perform(patch("/api/v1/admin/accounts/" + account.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unfreezeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("Super Admin Management: Branch provisioning, staff onboarding, GL balance, and audit trail")
    void shouldPerformSuperAdminOperations() throws Exception {
        // 1. Create a new branch
        String branchCodeStr = String.format("%04d", 1000 + (int)(Math.random() * 8000));
        String ifscCode = "FINS0" + branchCodeStr + "01";
        CreateBranchRequest branchReq = new CreateBranchRequest(
                branchCodeStr,
                "FinServ Mumbai Corporate " + branchCodeStr,
                ifscCode,
                "ROUT" + branchCodeStr,
                "Bandra Kurla Complex",
                "Mumbai",
                "Maharashtra",
                "400051",
                "+912211223344"
        );

        mockMvc.perform(post("/api/v1/admin/branches")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(branchReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ifscCode").value(ifscCode))
                .andExpect(jsonPath("$.branchCode").value(branchCodeStr));

        // 2. Provision new bank officer staff member
        Branch createdBranch = branchRepository.findByBranchCode(branchCodeStr).orElseThrow();
        String staffUsername = "officer_" + System.currentTimeMillis();
        CreateStaffRequest staffReq = new CreateStaffRequest(
                staffUsername,
                staffUsername + "@finserv.local",
                "+9194" + (long)(Math.random() * 90000000L + 10000000L),
                "OfficerSecureP@ss1!",
                "EMPLOYEE",
                createdBranch.getId(),
                "Operations",
                "Senior Credit Officer"
        );

        mockMvc.perform(post("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value(staffUsername))
                .andExpect(jsonPath("$.role").value("ROLE_EMPLOYEE"));

        // 3. GL Trial Balance
        mockMvc.perform(get("/api/v1/admin/ledger/summary")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balanced").value(true))
                .andExpect(jsonPath("$.accounts").isArray());

        // 4. Audit Trail Explorer
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("Super Admin should be able to provision multiple Super Admins and Bank Officers")
    void shouldAllowSuperAdminToProvisionAnotherSuperAdmin() throws Exception {
        Branch branch = branchRepository.findByBranchCode("1001").orElseThrow();
        String superAdminUser = "superadmin_" + System.currentTimeMillis();
        CreateStaffRequest staffReq = new CreateStaffRequest(
                superAdminUser,
                superAdminUser + "@finserv.local",
                "+9193" + (long)(Math.random() * 90000000L + 10000000L),
                "SuperAdminPass123!",
                "SUPER_ADMIN",
                branch.getId(),
                "Executive",
                "Chief Risk Officer"
        );

        mockMvc.perform(post("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value(superAdminUser))
                .andExpect(jsonPath("$.role").value("ROLE_SUPER_ADMIN"));
    }
}

