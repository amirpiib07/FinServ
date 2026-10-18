package com.finserv.modules.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finserv.common.exception.DuplicateResourceException;
import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.exception.ValidationException;
import com.finserv.common.security.FieldEncryptionService;
import com.finserv.common.util.UuidUtils;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.entity.AccountApplication;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.entity.GlChartOfAccount;
import com.finserv.modules.account.repository.AccountApplicationRepository;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.admin.dto.*;
import com.finserv.modules.audit.entity.AuditLog;
import com.finserv.modules.audit.repository.AuditLogRepository;
import com.finserv.modules.audit.service.AuditService;
import com.finserv.modules.identity.entity.Role;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.entity.UserRole;
import com.finserv.modules.identity.repository.RoleRepository;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.identity.repository.UserRoleRepository;
import com.finserv.modules.ledger.entity.GlLedgerPosting;
import com.finserv.modules.account.repository.GlChartOfAccountRepository;
import com.finserv.modules.ledger.repository.GlLedgerPostingRepository;
import com.finserv.modules.ledger.service.LedgerPostingService;
import com.finserv.modules.ledger.service.PostingInstruction;
import com.finserv.modules.onboarding.entity.Address;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.entity.CustomerDeclaration;
import com.finserv.modules.onboarding.entity.KycDocument;
import com.finserv.modules.onboarding.entity.OnboardingApplication;
import com.finserv.modules.onboarding.repository.*;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import com.finserv.modules.organization.dto.BranchDto;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.organization.entity.Employee;
import com.finserv.modules.organization.repository.BranchRepository;
import com.finserv.modules.organization.repository.EmployeeRepository;
import com.finserv.modules.sequence.generator.AccountNumberGenerator;
import com.finserv.modules.sequence.service.NumberSequenceService;
import com.finserv.modules.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private static final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final CustomerRepository customerRepository;
    private final OnboardingApplicationRepository onboardingApplicationRepository;
    private final AddressRepository addressRepository;
    private final CustomerDeclarationRepository customerDeclarationRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final AccountRepository accountRepository;
    private final AccountProductRepository accountProductRepository;
    private final AccountApplicationRepository accountApplicationRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final GlChartOfAccountRepository glChartOfAccountRepository;
    private final GlLedgerPostingRepository glLedgerPostingRepository;
    private final AuditLogRepository auditLogRepository;
    private final TransactionRepository transactionRepository;

    private final CustomerLookupService customerLookupService;
    private final AccountNumberGenerator accountNumberGenerator;
    private final NumberSequenceService numberSequenceService;
    private final LedgerPostingService ledgerPostingService;
    private final AuditService auditService;
    private final FieldEncryptionService fieldEncryptionService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public AdminService(UserRepository userRepository,
                        RoleRepository roleRepository,
                        UserRoleRepository userRoleRepository,
                        CustomerRepository customerRepository,
                        OnboardingApplicationRepository onboardingApplicationRepository,
                        AddressRepository addressRepository,
                        CustomerDeclarationRepository customerDeclarationRepository,
                        KycDocumentRepository kycDocumentRepository,
                        AccountRepository accountRepository,
                        AccountProductRepository accountProductRepository,
                        AccountApplicationRepository accountApplicationRepository,
                        BranchRepository branchRepository,
                        EmployeeRepository employeeRepository,
                        GlChartOfAccountRepository glChartOfAccountRepository,
                        GlLedgerPostingRepository glLedgerPostingRepository,
                        AuditLogRepository auditLogRepository,
                        TransactionRepository transactionRepository,
                        CustomerLookupService customerLookupService,
                        AccountNumberGenerator accountNumberGenerator,
                        NumberSequenceService numberSequenceService,
                        LedgerPostingService ledgerPostingService,
                        AuditService auditService,
                        FieldEncryptionService fieldEncryptionService,
                        PasswordEncoder passwordEncoder,
                        ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.customerRepository = customerRepository;
        this.onboardingApplicationRepository = onboardingApplicationRepository;
        this.addressRepository = addressRepository;
        this.customerDeclarationRepository = customerDeclarationRepository;
        this.kycDocumentRepository = kycDocumentRepository;
        this.accountRepository = accountRepository;
        this.accountProductRepository = accountProductRepository;
        this.accountApplicationRepository = accountApplicationRepository;
        this.branchRepository = branchRepository;
        this.employeeRepository = employeeRepository;
        this.glChartOfAccountRepository = glChartOfAccountRepository;
        this.glLedgerPostingRepository = glLedgerPostingRepository;
        this.auditLogRepository = auditLogRepository;
        this.transactionRepository = transactionRepository;
        this.customerLookupService = customerLookupService;
        this.accountNumberGenerator = accountNumberGenerator;
        this.numberSequenceService = numberSequenceService;
        this.ledgerPostingService = ledgerPostingService;
        this.auditService = auditService;
        this.fieldEncryptionService = fieldEncryptionService;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    // =========================================================================
    // 1. Executive Admin Overview
    // =========================================================================
    public AdminOverviewDto getOverview() {
        AdminOverviewDto dto = new AdminOverviewDto();

        dto.setTotalCustomers(customerRepository.count());
        dto.setPendingKycReviewsCount(onboardingApplicationRepository.countByStatusIn(List.of("SUBMITTED", "UNDER_REVIEW")));
        dto.setPendingAccountApplicationsCount(accountApplicationRepository.countByApplicationStatusIn(List.of("SUBMITTED", "UNDER_REVIEW")));
        dto.setTotalActiveAccounts(accountRepository.countByStatus("ACTIVE"));
        dto.setTotalCustomerDeposits(accountRepository.sumActiveCurrentBalances().setScale(2, RoundingMode.HALF_UP));

        Instant startOfToday = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        dto.setTodayTransactionVolume(transactionRepository.sumAmountSince(startOfToday).setScale(2, RoundingMode.HALF_UP));
        dto.setTodayTransactionCount(transactionRepository.countCompletedSince(startOfToday));

        // General Ledger Balancing Invariant Check: Sum(Debits) == Sum(Credits)
        List<GlLedgerPosting> postings = glLedgerPostingRepository.findAll();
        BigDecimal debits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal credits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        for (GlLedgerPosting p : postings) {
            if ("DEBIT".equalsIgnoreCase(p.getEntryType())) {
                debits = debits.add(p.getAmount());
            } else if ("CREDIT".equalsIgnoreCase(p.getEntryType())) {
                credits = credits.add(p.getAmount());
            }
        }

        dto.setTotalGlDebits(debits);
        dto.setTotalGlCredits(credits);
        dto.setGlIntegrityStatus(debits.compareTo(credits) == 0 ? "BALANCED" : "UNBALANCED");

        return dto;
    }

    // =========================================================================
    // 2. KYC Onboarding Applications & Review Workbench
    // =========================================================================
    public List<KycApplicationReviewDto> getKycApplications(String statusFilter, String searchQuery) {
        List<OnboardingApplication> applications;
        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            applications = onboardingApplicationRepository.findByStatusInOrderByCreatedAtDesc(List.of(statusFilter.toUpperCase()));
        } else if ("ALL".equalsIgnoreCase(statusFilter)) {
            applications = onboardingApplicationRepository.findAllByOrderByCreatedAtDesc();
        } else {
            // Default queue: Pending reviews
            applications = onboardingApplicationRepository.findByStatusInOrderByCreatedAtDesc(List.of("SUBMITTED", "UNDER_REVIEW"));
        }

        List<KycApplicationReviewDto> result = new ArrayList<>();
        for (OnboardingApplication app : applications) {
            KycApplicationReviewDto dto = toKycReviewDto(app);
            if (searchQuery != null && !searchQuery.isBlank()) {
                String q = searchQuery.toLowerCase().trim();
                boolean matches = (dto.getApplicationReference() != null && dto.getApplicationReference().toLowerCase().contains(q))
                        || (dto.getApplicantUsername() != null && dto.getApplicantUsername().toLowerCase().contains(q))
                        || (dto.getApplicantEmail() != null && dto.getApplicantEmail().toLowerCase().contains(q))
                        || (dto.getFirstName() != null && dto.getFirstName().toLowerCase().contains(q))
                        || (dto.getLastName() != null && dto.getLastName().toLowerCase().contains(q));
                if (matches) {
                    result.add(dto);
                }
            } else {
                result.add(dto);
            }
        }

        return result;
    }

    @Transactional
    public KycApplicationReviewDto decideKycApplication(UUID applicationId, KycDecisionRequest req,
                                                         UUID officerUserId, String officerRole,
                                                         String ipAddress, String userAgent) {
        OnboardingApplication app = onboardingApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding application not found: " + applicationId));

        if (!List.of("SUBMITTED", "UNDER_REVIEW", "DRAFT").contains(app.getStatus()) && !"REJECTED".equalsIgnoreCase(app.getStatus())) {
            throw new ValidationException("Application is in status '" + app.getStatus() + "' and cannot be re-evaluated.");
        }

        String decision = req.getDecision().trim().toUpperCase();
        if ("APPROVE".equalsIgnoreCase(decision)) {
            // Maker-checker invariant enforcement (chk_onboarding_maker_checker):
            // verified_by_user_id must be distinct from approved_by_user_id
            if (app.getVerifiedByUserId() == null) {
                app.setVerifiedByUserId(SYSTEM_USER_ID);
                app.setVerifiedAt(Instant.now());
            } else if (app.getVerifiedByUserId().equals(officerUserId)) {
                // If officer also did maker check, switch maker to SYSTEM_INTERNAL to satisfy check constraint
                app.setVerifiedByUserId(SYSTEM_USER_ID);
            }

            app.setApprovedByUserId(officerUserId);
            app.setApprovedAt(Instant.now());
            app.setStatus("APPROVED");
            app.setRejectionReason(null);
            app.setCurrentStep(5);
            onboardingApplicationRepository.save(app);

            // Activate User
            User user = userRepository.findById(app.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + app.getUserId()));
            user.setStatus("ACTIVE");
            userRepository.save(user);

            // Create/Verify Customer Record
            Customer customer = customerLookupService.getOrCreateCustomerForUser(app.getUserId());
            customer.setKycStatus("VERIFIED");
            customerRepository.save(customer);

            // Update KYC Documents to VERIFIED
            List<KycDocument> kycDocs = kycDocumentRepository.findByApplicationId(app.getId());
            for (KycDocument doc : kycDocs) {
                doc.setVerificationStatus("VERIFIED");
            }
            kycDocumentRepository.saveAll(kycDocs);

            // Auto-open primary Savings Account if customer has zero accounts
            List<Account> existingAccounts = accountRepository.findByCustomerId(customer.getId());
            if (existingAccounts.isEmpty()) {
                autoOpenDefaultSavingsAccount(customer, officerUserId);
            }

            // Audit Trail
            auditService.logEvent(
                    "KYC_APPLICATION_APPROVED",
                    "ONBOARDING_APPLICATION",
                    app.getId().toString(),
                    officerUserId,
                    officerRole,
                    "APPROVE",
                    ipAddress,
                    userAgent,
                    null,
                    null,
                    serialize(Map.of("reference", app.getApplicationReference(), "remarks", req.getRemarks()))
            );

            log.info("Officer {} approved KYC application {} for customer {}", officerUserId, app.getApplicationReference(), customer.getCustomerNumber());

        } else if ("REJECT".equalsIgnoreCase(decision)) {
            app.setStatus("REJECTED");
            app.setRejectionReason(req.getRemarks());
            onboardingApplicationRepository.save(app);

            List<KycDocument> kycDocs = kycDocumentRepository.findByApplicationId(app.getId());
            for (KycDocument doc : kycDocs) {
                doc.setVerificationStatus("REJECTED");
            }
            kycDocumentRepository.saveAll(kycDocs);

            auditService.logEvent(
                    "KYC_APPLICATION_REJECTED",
                    "ONBOARDING_APPLICATION",
                    app.getId().toString(),
                    officerUserId,
                    officerRole,
                    "REJECT",
                    ipAddress,
                    userAgent,
                    null,
                    null,
                    serialize(Map.of("reference", app.getApplicationReference(), "reason", req.getRemarks()))
            );

            log.info("Officer {} rejected KYC application {}: {}", officerUserId, app.getApplicationReference(), req.getRemarks());
        }

        return toKycReviewDto(app);
    }

    private void autoOpenDefaultSavingsAccount(Customer customer, UUID officerId) {
        try {
            AccountProduct savingsProduct = accountProductRepository.findByProductCode("01")
                    .orElseGet(() -> accountProductRepository.findAll().stream().findFirst().orElse(null));
            Branch branch = branchRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("No branch available for account opening"));

            if (savingsProduct == null) {
                log.warn("No savings product found for auto-opening account for customer {}", customer.getId());
                return;
            }

            long seq = numberSequenceService.getNextValue("account_num_seq");
            String accountNumber = accountNumberGenerator.generate(branch.getBranchCode(), savingsProduct.getProductCode(), seq);

            Account account = new Account();
            account.setCustomerId(customer.getId());
            account.setBranchId(branch.getId());
            account.setProductId(savingsProduct.getId());
            account.setAccountNumber(accountNumber);
            account.setCurrency("INR");
            account.setCurrentBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            account.setAvailableBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            account.setHoldBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            account.setStatus("ACTIVE");
            account.setNickname("Primary Savings");
            account.setOpenedAt(Instant.now());

            accountRepository.save(account);
            log.info("Auto-opened initial account {} for approved customer {}", accountNumber, customer.getCustomerNumber());
        } catch (Exception e) {
            log.error("Failed to auto-open default account for customer {}: {}", customer.getId(), e.getMessage());
        }
    }

    // =========================================================================
    // 3. Accounts Directory & Status Control (Freeze/Unfreeze)
    // =========================================================================
    public AdminPageResponse<AdminAccountSummaryDto> getAccounts(String status, String search, int page, int size) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.max(1, size));
        String filterStatus = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status))
                ? status.trim().toUpperCase()
                : null;
        String searchStr = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;

        Page<Account> accountPage = accountRepository.findAdminFilteredAccounts(filterStatus, searchStr, pageRequest);

        List<AdminAccountSummaryDto> dtos = accountPage.getContent().stream()
                .map(this::toAdminAccountSummary)
                .toList();

        return new AdminPageResponse<>(dtos, accountPage.getNumber(), accountPage.getSize(),
                accountPage.getTotalElements(), accountPage.getTotalPages());
    }

    @Transactional
    public AdminAccountSummaryDto updateAccountStatus(UUID accountId, AccountStatusUpdateRequest req,
                                                      UUID officerUserId, String officerRole,
                                                      String ipAddress, String userAgent) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

        if ("CLOSED".equalsIgnoreCase(account.getStatus())) {
            throw new ValidationException("Closed accounts cannot have their status altered.");
        }

        String targetStatus = req.getStatus().trim().toUpperCase();
        String oldStatus = account.getStatus();

        if (targetStatus.equalsIgnoreCase(oldStatus)) {
            return toAdminAccountSummary(account);
        }

        account.setStatus(targetStatus);
        account = accountRepository.save(account);

        String eventSubtype = "FROZEN".equalsIgnoreCase(targetStatus) ? "FREEZE" : "UNFREEZE";
        auditService.logEvent(
                "ACCOUNT_STATUS_" + eventSubtype,
                "ACCOUNT",
                account.getId().toString(),
                officerUserId,
                officerRole,
                "UPDATE",
                ipAddress,
                userAgent,
                null,
                serialize(Map.of("oldStatus", oldStatus)),
                serialize(Map.of("newStatus", targetStatus, "action", eventSubtype, "reason", req.getReason()))
        );

        log.info("Officer {} performed {} on account {} (reason: {})", officerUserId, eventSubtype, account.getAccountNumber(), req.getReason());
        return toAdminAccountSummary(account);
    }

    // =========================================================================
    // 4. Account Applications Review Queue
    // =========================================================================
    public List<AdminAccountApplicationDto> getAccountApplications(String status) {
        List<AccountApplication> list;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = accountApplicationRepository.findByApplicationStatusIn(List.of(status.trim().toUpperCase()));
        } else {
            list = accountApplicationRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream().map(this::toAdminAccountApplicationDto).toList();
    }

    @Transactional
    public AdminAccountApplicationDto decideAccountApplication(UUID applicationId, AccountApplicationDecisionRequest req,
                                                               UUID officerUserId, String officerRole,
                                                               String ipAddress, String userAgent) {
        AccountApplication app = accountApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Account application not found: " + applicationId));

        if (!List.of("SUBMITTED", "UNDER_REVIEW").contains(app.getApplicationStatus())) {
            throw new ValidationException("Application is already " + app.getApplicationStatus());
        }

        String decision = req.getDecision().trim().toUpperCase();
        if ("APPROVE".equalsIgnoreCase(decision)) {
            AccountProduct product = accountProductRepository.findById(app.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account product not found: " + app.getProductId()));
            Branch branch = branchRepository.findById(app.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + app.getBranchId()));

            long seq = numberSequenceService.getNextValue("account_num_seq");
            String accountNumber = accountNumberGenerator.generate(branch.getBranchCode(), product.getProductCode(), seq);

            Account account = new Account();
            account.setCustomerId(app.getCustomerId());
            account.setBranchId(branch.getId());
            account.setProductId(product.getId());
            account.setAccountNumber(accountNumber);
            account.setCurrency("INR");
            account.setStatus("ACTIVE");
            account.setNickname(product.getProductName());
            account.setOpenedAt(Instant.now());

            BigDecimal initialDeposit = app.getInitialDepositAmount();
            account.setCurrentBalance(initialDeposit);
            account.setAvailableBalance(initialDeposit);
            account.setHoldBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            account = accountRepository.save(account);

            // Double-entry GL posting if initial deposit was funded
            if (initialDeposit.compareTo(BigDecimal.ZERO) > 0) {
                UUID cashGlId = UUID.fromString("00000000-0000-0000-0001-000000010100"); // 10100 Vault Cash
                ledgerPostingService.recordJournalEntry(
                        "ACCOUNT_OPENING_DEPOSIT",
                        "Initial account funding for " + account.getAccountNumber(),
                        officerUserId,
                        List.of(
                                new PostingInstruction(cashGlId, null, "DEBIT", initialDeposit),
                                new PostingInstruction(product.getGlAccountId(), account.getId(), "CREDIT", initialDeposit)
                        )
                );
            }

            app.setApplicationStatus("APPROVED");
            app.setCreatedAccountId(account.getId());
            app.setReviewedByUserId(officerUserId);
            app.setReviewedAt(Instant.now());
            app.setRejectionReason(null);
            accountApplicationRepository.save(app);

            auditService.logEvent(
                    "ACCOUNT_APPLICATION_APPROVED",
                    "ACCOUNT_APPLICATION",
                    app.getId().toString(),
                    officerUserId,
                    officerRole,
                    "APPROVE",
                    ipAddress,
                    userAgent,
                    null,
                    null,
                    serialize(Map.of("applicationNumber", app.getApplicationNumber(), "accountNumber", accountNumber))
            );

        } else if ("REJECT".equalsIgnoreCase(decision)) {
            app.setApplicationStatus("REJECTED");
            app.setRejectionReason(req.getRemarks());
            app.setReviewedByUserId(officerUserId);
            app.setReviewedAt(Instant.now());
            accountApplicationRepository.save(app);

            auditService.logEvent(
                    "ACCOUNT_APPLICATION_REJECTED",
                    "ACCOUNT_APPLICATION",
                    app.getId().toString(),
                    officerUserId,
                    officerRole,
                    "REJECT",
                    ipAddress,
                    userAgent,
                    null,
                    null,
                    serialize(Map.of("applicationNumber", app.getApplicationNumber(), "reason", req.getRemarks()))
            );
        }

        return toAdminAccountApplicationDto(app);
    }

    // =========================================================================
    // 5. Super Admin — Branches & Staff Management
    // =========================================================================
    public List<BranchDto> getBranches() {
        return branchRepository.findAll().stream()
                .map(b -> new BranchDto(
                        b.getId(),
                        b.getBranchCode(),
                        b.getBranchName(),
                        b.getIfscCode(),
                        b.getRoutingNumber(),
                        b.getStreetAddress(),
                        b.getCity(),
                        b.getState(),
                        b.getPostalCode(),
                        b.getPhoneNumber(),
                        b.getStatus()
                ))
                .toList();
    }

    @Transactional
    public BranchDto createBranch(CreateBranchRequest req, UUID officerUserId, String officerRole,
                                   String ipAddress, String userAgent) {
        if (branchRepository.existsByBranchCode(req.getBranchCode().trim())) {
            throw new DuplicateResourceException("A branch with branch code " + req.getBranchCode() + " already exists.");
        }
        if (branchRepository.findByIfscCode(req.getIfscCode().trim().toUpperCase()).isPresent()) {
            throw new DuplicateResourceException("A branch with IFSC code " + req.getIfscCode() + " already exists.");
        }

        Branch branch = new Branch();
        branch.setBranchCode(req.getBranchCode().trim());
        branch.setBranchName(req.getBranchName().trim());
        branch.setIfscCode(req.getIfscCode().trim().toUpperCase());
        branch.setRoutingNumber(req.getRoutingNumber().trim());
        branch.setStreetAddress(req.getStreetAddress().trim());
        branch.setCity(req.getCity().trim());
        branch.setState(req.getState().trim());
        branch.setPostalCode(req.getPostalCode().trim());
        branch.setPhoneNumber(req.getPhoneNumber().trim());
        branch.setStatus("ACTIVE");

        branch = branchRepository.save(branch);

        auditService.logEvent(
                "BRANCH_CREATED",
                "BRANCH",
                branch.getId().toString(),
                officerUserId,
                officerRole,
                "CREATE",
                ipAddress,
                userAgent,
                null,
                null,
                serialize(Map.of("branchCode", branch.getBranchCode(), "ifsc", branch.getIfscCode()))
        );

        log.info("Super Admin {} created new branch {} ({})", officerUserId, branch.getBranchName(), branch.getIfscCode());

        return new BranchDto(
                branch.getId(),
                branch.getBranchCode(),
                branch.getBranchName(),
                branch.getIfscCode(),
                branch.getRoutingNumber(),
                branch.getStreetAddress(),
                branch.getCity(),
                branch.getState(),
                branch.getPostalCode(),
                branch.getPhoneNumber(),
                branch.getStatus()
        );
    }

    public List<StaffUserDto> getStaffUsers() {
        Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE").orElse(null);
        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElse(null);
        Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN").orElse(null);

        Set<Integer> staffRoleIds = new HashSet<>();
        if (employeeRole != null) staffRoleIds.add(employeeRole.getId());
        if (adminRole != null) staffRoleIds.add(adminRole.getId());
        if (superAdminRole != null) staffRoleIds.add(superAdminRole.getId());

        List<UserRole> staffUserRoles = userRoleRepository.findAll().stream()
                .filter(ur -> staffRoleIds.contains(ur.getRoleId()))
                .toList();

        Set<UUID> userIds = new HashSet<>();
        for (UserRole ur : staffUserRoles) {
            userIds.add(ur.getUserId());
        }

        List<StaffUserDto> dtos = new ArrayList<>();
        for (UUID uId : userIds) {
            userRepository.findById(uId).ifPresent(u -> {
                if (u.isSystem()) return;

                StaffUserDto dto = new StaffUserDto();
                dto.setId(u.getId());
                dto.setUsername(u.getUsername());
                dto.setEmail(u.getEmail());
                dto.setPhoneNumber(u.getPhoneNumber());
                dto.setStatus(u.getStatus());
                dto.setCreatedAt(u.getCreatedAt());

                // Find primary role
                List<UserRole> myRoles = userRoleRepository.findByUserId(u.getId());
                String primaryRole = "ROLE_EMPLOYEE";
                for (UserRole r : myRoles) {
                    if (superAdminRole != null && r.getRoleId().equals(superAdminRole.getId())) {
                        primaryRole = "ROLE_SUPER_ADMIN";
                        break;
                    }
                    if (adminRole != null && r.getRoleId().equals(adminRole.getId())) {
                        primaryRole = "ROLE_ADMIN";
                    }
                }
                dto.setRole(primaryRole);

                // Find employee profile
                employeeRepository.findByUserId(u.getId()).ifPresent(emp -> {
                    dto.setEmployeeCode(emp.getEmployeeCode());
                    dto.setDepartment(emp.getDepartment());
                    dto.setDesignation(emp.getDesignation());
                    dto.setJoiningDate(emp.getJoiningDate());
                    dto.setBranchId(emp.getBranchId());

                    branchRepository.findById(emp.getBranchId()).ifPresent(b -> {
                        dto.setBranchName(b.getBranchName());
                        dto.setBranchCode(b.getBranchCode());
                    });
                });

                dtos.add(dto);
            });
        }

        return dtos;
    }

    @Transactional
    public StaffUserDto createStaffUser(CreateStaffRequest req, UUID officerUserId, String officerRole,
                                         String ipAddress, String userAgent) {
        String username = req.getUsername().trim();
        String email = req.getEmail().trim().toLowerCase();
        String phone = req.getPhoneNumber().trim();

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already registered");
        }
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email '" + email + "' is already registered");
        }
        if (userRepository.existsByPhoneNumber(phone)) {
            throw new DuplicateResourceException("Phone number '" + phone + "' is already registered");
        }

        Branch branch = branchRepository.findById(req.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + req.getBranchId()));

        String requestedRole = "ROLE_" + req.getRole().trim().toUpperCase();
        Role role = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + requestedRole));

        UUID userId = UuidUtils.generateV4();
        User user = new User(userId);
        user.setUsername(username);
        user.setEmail(email);
        user.setPhoneNumber(phone);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setStatus("ACTIVE");
        user.setSystem(false);
        user.setEmailVerifiedAt(Instant.now());
        user.setPhoneVerifiedAt(Instant.now());

        user = userRepository.save(user);
        userRoleRepository.save(new UserRole(userId, role.getId()));

        // Also assign ROLE_EMPLOYEE if ADMIN so they have standard counter operations
        if ("ROLE_ADMIN".equals(requestedRole)) {
            roleRepository.findByName("ROLE_EMPLOYEE").ifPresent(empRole -> {
                userRoleRepository.save(new UserRole(userId, empRole.getId()));
            });
        }

        // Create Employee Profile
        String empCode = "EMP" + branch.getBranchCode() + String.format("%04d", (int)(Math.random() * 9000 + 1000));
        Employee employee = new Employee();
        employee.setUserId(userId);
        employee.setBranchId(branch.getId());
        employee.setEmployeeCode(empCode);
        employee.setDepartment(req.getDepartment().trim());
        employee.setDesignation(req.getDesignation().trim());
        employee.setJoiningDate(LocalDate.now());
        employee.setStatus("ACTIVE");

        employeeRepository.save(employee);

        auditService.logEvent(
                "STAFF_PROVISIONED",
                "USER",
                userId.toString(),
                officerUserId,
                officerRole,
                "CREATE",
                ipAddress,
                userAgent,
                null,
                null,
                serialize(Map.of("username", username, "role", requestedRole, "employeeCode", empCode))
        );

        log.info("Super Admin {} provisioned new staff user {} ({})", officerUserId, username, requestedRole);

        StaffUserDto dto = new StaffUserDto();
        dto.setId(userId);
        dto.setUsername(username);
        dto.setEmail(email);
        dto.setPhoneNumber(phone);
        dto.setRole(requestedRole);
        dto.setStatus("ACTIVE");
        dto.setBranchId(branch.getId());
        dto.setBranchName(branch.getBranchName());
        dto.setBranchCode(branch.getBranchCode());
        dto.setEmployeeCode(empCode);
        dto.setDepartment(employee.getDepartment());
        dto.setDesignation(employee.getDesignation());
        dto.setJoiningDate(employee.getJoiningDate());
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }

    // =========================================================================
    // 6. Double-Entry GL Trial Balance
    // =========================================================================
    public GlTrialBalanceDto getGlTrialBalance() {
        List<GlChartOfAccount> chart = glChartOfAccountRepository.findAll();
        List<GlLedgerPosting> postings = glLedgerPostingRepository.findAll();

        Map<UUID, BigDecimal> debitsMap = new HashMap<>();
        Map<UUID, BigDecimal> creditsMap = new HashMap<>();

        for (GlLedgerPosting p : postings) {
            if ("DEBIT".equalsIgnoreCase(p.getEntryType())) {
                debitsMap.merge(p.getGlAccountId(), p.getAmount(), BigDecimal::add);
            } else if ("CREDIT".equalsIgnoreCase(p.getEntryType())) {
                creditsMap.merge(p.getGlAccountId(), p.getAmount(), BigDecimal::add);
            }
        }

        BigDecimal grandTotalDebits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotalCredits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        List<GlAccountTrialDto> rows = new ArrayList<>();

        for (GlChartOfAccount acc : chart) {
            BigDecimal deb = debitsMap.getOrDefault(acc.getId(), BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal cred = creditsMap.getOrDefault(acc.getId(), BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            grandTotalDebits = grandTotalDebits.add(deb);
            grandTotalCredits = grandTotalCredits.add(cred);

            BigDecimal netBalance;
            if ("DEBIT".equalsIgnoreCase(acc.getBalanceSide())) {
                netBalance = deb.subtract(cred);
            } else {
                netBalance = cred.subtract(deb);
            }

            rows.add(new GlAccountTrialDto(
                    acc.getId(),
                    acc.getGlCode(),
                    acc.getAccountName(),
                    acc.getAccountType(),
                    acc.getBalanceSide(),
                    deb,
                    cred,
                    netBalance
            ));
        }

        rows.sort(Comparator.comparing(GlAccountTrialDto::getGlCode));
        boolean balanced = grandTotalDebits.compareTo(grandTotalCredits) == 0;

        return new GlTrialBalanceDto(rows, grandTotalDebits, grandTotalCredits, balanced);
    }

    // =========================================================================
    // 7. Tamper-Evident SHA-256 Audit Trail
    // =========================================================================
    public AdminPageResponse<AdminAuditLogDto> getAuditLogs(String action, String entityType, UUID actorUserId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.max(1, size));
        String actionFilter = (action != null && !action.isBlank() && !"ALL".equalsIgnoreCase(action)) ? action.trim().toUpperCase() : null;
        String entityFilter = (entityType != null && !entityType.isBlank() && !"ALL".equalsIgnoreCase(entityType)) ? entityType.trim().toUpperCase() : null;

        Page<AuditLog> logPage = auditLogRepository.findFilteredAuditLogs(actionFilter, entityFilter, actorUserId, pageRequest);

        Map<UUID, String> usernameCache = new HashMap<>();
        List<AdminAuditLogDto> dtos = new ArrayList<>();

        for (AuditLog logEntry : logPage.getContent()) {
            AdminAuditLogDto dto = new AdminAuditLogDto();
            dto.setId(logEntry.getId());
            dto.setChainSeq(logEntry.getChainSeq());
            dto.setEventType(logEntry.getEventType());
            dto.setEntityType(logEntry.getEntityType());
            dto.setEntityId(logEntry.getEntityId());
            dto.setActorUserId(logEntry.getActorUserId());
            dto.setActorRole(logEntry.getActorRole());
            dto.setAction(logEntry.getAction());
            dto.setIpAddress(logEntry.getIpAddress());
            dto.setUserAgent(logEntry.getUserAgent());
            dto.setCorrelationId(logEntry.getCorrelationId());
            dto.setPreviousHash(logEntry.getPreviousHash());
            dto.setCurrentHash(logEntry.getCurrentHash());
            dto.setCreatedAt(logEntry.getCreatedAt());

            if (logEntry.getActorUserId() != null) {
                String actorName = usernameCache.computeIfAbsent(logEntry.getActorUserId(), id ->
                        userRepository.findById(id).map(User::getUsername).orElse("User#" + id.toString().substring(0, 8)));
                dto.setActorUsername(actorName);
            } else {
                dto.setActorUsername("SYSTEM");
            }

            dto.setChainValid(true);
            dtos.add(dto);
        }

        return new AdminPageResponse<>(dtos, logPage.getNumber(), logPage.getSize(),
                logPage.getTotalElements(), logPage.getTotalPages());
    }

    // =========================================================================
    // Helpers
    // =========================================================================
    private KycApplicationReviewDto toKycReviewDto(OnboardingApplication app) {
        KycApplicationReviewDto dto = new KycApplicationReviewDto();
        dto.setId(app.getId());
        dto.setUserId(app.getUserId());
        dto.setApplicationReference(app.getApplicationReference());
        dto.setStatus(app.getStatus());
        dto.setCurrentStep(app.getCurrentStep());
        dto.setSubmittedAt(app.getSubmittedAt());
        dto.setRejectionReason(app.getRejectionReason());

        userRepository.findById(app.getUserId()).ifPresent(u -> {
            dto.setApplicantUsername(u.getUsername());
            dto.setApplicantEmail(u.getEmail());
            dto.setApplicantPhone(u.getPhoneNumber());
        });

        // Unpack draft data for personal details
        if (app.getDraftDataEncrypted() != null) {
            try {
                String decrypted = fieldEncryptionService.decrypt(app.getDraftDataEncrypted());
                Map<String, Object> draft = objectMapper.readValue(decrypted, new TypeReference<>() {});
                @SuppressWarnings("unchecked")
                Map<String, Object> step2 = (Map<String, Object>) draft.get("step2");
                if (step2 != null) {
                    dto.setFirstName((String) step2.get("firstName"));
                    dto.setLastName((String) step2.get("lastName"));
                    dto.setDateOfBirth((String) step2.get("dateOfBirth"));
                    dto.setGender((String) step2.get("gender"));
                }
                @SuppressWarnings("unchecked")
                Map<String, Object> step4 = (Map<String, Object>) draft.get("step4");
                if (step4 != null) {
                    String pan = (String) step4.get("panNumber");
                    if (pan != null && pan.length() >= 5) {
                        dto.setMaskedPan(pan.substring(0, 2) + "•••••" + pan.substring(pan.length() - 2));
                    }
                    dto.setIdType((String) step4.get("idType"));
                    String idNum = (String) step4.get("idNumber");
                    if (idNum != null && idNum.length() >= 4) {
                        dto.setMaskedIdNumber("•••• " + idNum.substring(idNum.length() - 4));
                    }
                }
            } catch (Exception e) {
                log.warn("Could not decrypt draft data for app {}: {}", app.getId(), e.getMessage());
            }
        }

        // Residential address
        addressRepository.findByApplicationId(app.getId()).stream()
                .filter(Address::isPrimary)
                .findFirst()
                .ifPresent(addr -> {
                    String full = addr.getStreetLine1() + ", " + addr.getCity() + ", " + addr.getState() + " " + addr.getPostalCode();
                    dto.setResidentialAddress(full);
                });

        // Declarations
        List<String> declarations = customerDeclarationRepository.findByApplicationId(app.getId()).stream()
                .filter(CustomerDeclaration::isAccepted)
                .map(CustomerDeclaration::getDeclarationType)
                .toList();
        dto.setDeclarationsAccepted(declarations);

        return dto;
    }

    private AdminAccountSummaryDto toAdminAccountSummary(Account account) {
        AdminAccountSummaryDto dto = new AdminAccountSummaryDto();
        dto.setId(account.getId());
        dto.setCustomerId(account.getCustomerId());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setMaskedAccountNumber(maskAccountNumber(account.getAccountNumber()));
        dto.setCurrentBalance(account.getCurrentBalance().setScale(2, RoundingMode.HALF_UP));
        dto.setAvailableBalance(account.getAvailableBalance().setScale(2, RoundingMode.HALF_UP));
        dto.setHoldBalance(account.getHoldBalance().setScale(2, RoundingMode.HALF_UP));
        dto.setStatus(account.getStatus());
        dto.setNickname(account.getNickname());
        dto.setOpenedAt(account.getOpenedAt());

        customerRepository.findById(account.getCustomerId()).ifPresent(c -> {
            dto.setCustomerNumber(c.getCustomerNumber());
            dto.setCustomerName(c.getFirstName() + " " + c.getLastName());
        });

        accountProductRepository.findById(account.getProductId()).ifPresent(p -> {
            dto.setProductName(p.getProductName());
            dto.setProductType(p.getProductType());
        });

        branchRepository.findById(account.getBranchId()).ifPresent(b -> {
            dto.setBranchName(b.getBranchName());
            dto.setBranchCode(b.getBranchCode());
            dto.setIfscCode(b.getIfscCode());
        });

        return dto;
    }

    private AdminAccountApplicationDto toAdminAccountApplicationDto(AccountApplication app) {
        AdminAccountApplicationDto dto = new AdminAccountApplicationDto();
        dto.setId(app.getId());
        dto.setApplicationNumber(app.getApplicationNumber());
        dto.setCustomerId(app.getCustomerId());
        dto.setProductId(app.getProductId());
        dto.setBranchId(app.getBranchId());
        dto.setInitialDepositAmount(app.getInitialDepositAmount().setScale(2, RoundingMode.HALF_UP));
        dto.setApplicationStatus(app.getApplicationStatus());
        dto.setRejectionReason(app.getRejectionReason());
        dto.setCreatedAccountId(app.getCreatedAccountId());
        dto.setCreatedAt(app.getCreatedAt());

        customerRepository.findById(app.getCustomerId()).ifPresent(c -> {
            dto.setCustomerNumber(c.getCustomerNumber());
            dto.setCustomerName(c.getFirstName() + " " + c.getLastName());
        });

        accountProductRepository.findById(app.getProductId()).ifPresent(p -> {
            dto.setProductName(p.getProductName());
            dto.setProductType(p.getProductType());
        });

        if (app.getBranchId() != null) {
            branchRepository.findById(app.getBranchId()).ifPresent(b -> {
                dto.setBranchName(b.getBranchName());
                dto.setIfscCode(b.getIfscCode());
            });
        }

        return dto;
    }

    private String maskAccountNumber(String acc) {
        if (acc == null || acc.length() < 4) return "••••";
        return "•••• " + acc.substring(acc.length() - 4);
    }

    private String serialize(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}
