package com.finserv.modules.beneficiary.service;

import com.finserv.common.exception.DuplicateResourceException;
import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.exception.ValidationException;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.audit.service.AuditService;
import com.finserv.modules.beneficiary.dto.BeneficiaryDto;
import com.finserv.modules.beneficiary.dto.CreateBeneficiaryRequest;
import com.finserv.modules.beneficiary.dto.VerifyBeneficiaryRequest;
import com.finserv.modules.beneficiary.entity.Beneficiary;
import com.finserv.modules.beneficiary.repository.BeneficiaryRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class BeneficiaryService {

    private static final Logger log = LoggerFactory.getLogger(BeneficiaryService.class);

    private final BeneficiaryRepository beneficiaryRepository;
    private final AccountRepository accountRepository;
    private final CustomerLookupService customerLookupService;
    private final AuditService auditService;

    public BeneficiaryService(BeneficiaryRepository beneficiaryRepository,
                              AccountRepository accountRepository,
                              CustomerLookupService customerLookupService,
                              AuditService auditService) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.accountRepository = accountRepository;
        this.customerLookupService = customerLookupService;
        this.auditService = auditService;
    }

    public List<BeneficiaryDto> getCustomerBeneficiaries(UUID userId) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        return beneficiaryRepository.findByCustomerIdAndIsActiveTrueOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public BeneficiaryDto addBeneficiary(UUID userId, CreateBeneficiaryRequest req) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);

        if (!req.getAccountNumber().trim().equals(req.getConfirmAccountNumber().trim())) {
            throw new ValidationException("Account number and confirmation account number do not match.");
        }

        String accNum = req.getAccountNumber().trim();
        String ifsc = req.getIfscCode().trim().toUpperCase();

        // 1. Prevent duplicate active beneficiary for same account & IFSC
        if (beneficiaryRepository.existsByCustomerIdAndAccountNumberAndIfscCodeAndIsActiveTrue(customer.getId(), accNum, ifsc)) {
            throw new DuplicateResourceException("A beneficiary with account number " + accNum + " and IFSC " + ifsc + " already exists.");
        }

        // 2. Internal FinServ account lookup & self-beneficiary check
        Optional<Account> internalAccountOpt = accountRepository.findByAccountNumber(accNum);
        String payeeType = "INTER_BANK";

        if (internalAccountOpt.isPresent()) {
            Account targetAccount = internalAccountOpt.get();
            if (targetAccount.getCustomerId().equals(customer.getId())) {
                throw new ValidationException("You cannot add your own FinServ account as a beneficiary.");
            }
            payeeType = "INTRA_BANK";
        }

        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setCustomerId(customer.getId());
        beneficiary.setPayeeType(payeeType);
        beneficiary.setNickname(req.getNickname().trim());
        beneficiary.setBeneficiaryName(req.getBeneficiaryName().trim());
        beneficiary.setAccountNumber(accNum);
        beneficiary.setIfscCode(ifsc);
        beneficiary.setBankName(req.getBankName().trim());
        beneficiary.setDailyTransferLimit(req.getDailyTransferLimit());
        // Standard cooling-off period of 24 hours (simulated)
        beneficiary.setCoolingOffUntil(Instant.now().plus(Duration.ofHours(24)));
        beneficiary.setVerificationStatus("PENDING_VERIFICATION");
        beneficiary.setActive(true);

        beneficiary = beneficiaryRepository.save(beneficiary);

        auditService.logEvent(
                "BENEFICIARY_CREATED",
                "BENEFICIARY",
                beneficiary.getId(),
                userId,
                "ROLE_CUSTOMER",
                "CREATE",
                null,
                Map.of(
                        "nickname", beneficiary.getNickname(),
                        "maskedAccount", maskAccountNumber(beneficiary.getAccountNumber()),
                        "ifsc", beneficiary.getIfscCode(),
                        "payeeType", beneficiary.getPayeeType()
                )
        );

        log.info("Beneficiary {} created for customer {}", beneficiary.getNickname(), customer.getCustomerNumber());
        return toDto(beneficiary);
    }

    @Transactional
    public BeneficiaryDto verifyBeneficiary(UUID beneficiaryId, UUID userId, VerifyBeneficiaryRequest req) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);

        Beneficiary beneficiary = beneficiaryRepository.findByIdAndCustomerId(beneficiaryId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found: " + beneficiaryId));

        if (!beneficiary.isActive()) {
            throw new ValidationException("Cannot verify a deactivated beneficiary.");
        }

        if ("VERIFIED".equalsIgnoreCase(beneficiary.getVerificationStatus())) {
            throw new ValidationException("Beneficiary is already verified.");
        }

        // Validate 6-digit OTP (for dev/demo simulation, any valid 6-digit format succeeds)
        if (req.getOtpCode() == null || !req.getOtpCode().matches("^[0-9]{6}$")) {
            throw new ValidationException("Invalid OTP code. Must be a 6-digit number.");
        }

        beneficiary.setVerificationStatus("VERIFIED");
        // Optionally shorten cooling off upon OTP verification for smoother dev experience
        beneficiary.setCoolingOffUntil(Instant.now().plus(Duration.ofMinutes(30)));
        beneficiary = beneficiaryRepository.save(beneficiary);

        auditService.logEvent(
                "BENEFICIARY_VERIFIED",
                "BENEFICIARY",
                beneficiary.getId(),
                userId,
                "ROLE_CUSTOMER",
                "UPDATE",
                Map.of("status", "PENDING_VERIFICATION"),
                Map.of("status", "VERIFIED")
        );

        log.info("Beneficiary {} verified for customer {}", beneficiary.getId(), customer.getCustomerNumber());
        return toDto(beneficiary);
    }

    @Transactional
    public void deleteBeneficiary(UUID beneficiaryId, UUID userId) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);

        Beneficiary beneficiary = beneficiaryRepository.findByIdAndCustomerId(beneficiaryId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found: " + beneficiaryId));

        beneficiary.setActive(false);
        beneficiaryRepository.save(beneficiary);

        auditService.logEvent(
                "BENEFICIARY_DEACTIVATED",
                "BENEFICIARY",
                beneficiary.getId(),
                userId,
                "ROLE_CUSTOMER",
                "DELETE",
                Map.of("isActive", "true"),
                Map.of("isActive", "false")
        );

        log.info("Beneficiary {} deactivated by customer {}", beneficiaryId, customer.getCustomerNumber());
    }

    private BeneficiaryDto toDto(Beneficiary b) {
        BeneficiaryDto dto = new BeneficiaryDto();
        dto.setId(b.getId());
        dto.setCustomerId(b.getCustomerId());
        dto.setPayeeType(b.getPayeeType());
        dto.setNickname(b.getNickname());
        dto.setBeneficiaryName(b.getBeneficiaryName());
        dto.setAccountNumber(b.getAccountNumber());
        dto.setMaskedAccountNumber(maskAccountNumber(b.getAccountNumber()));
        dto.setIfscCode(b.getIfscCode());
        dto.setBankName(b.getBankName());
        dto.setDailyTransferLimit(b.getDailyTransferLimit());
        dto.setCoolingOffUntil(b.getCoolingOffUntil());
        dto.setVerificationStatus(b.getVerificationStatus());
        dto.setActive(b.isActive());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }

    private String maskAccountNumber(String accNum) {
        if (accNum == null || accNum.length() < 4) {
            return "••••";
        }
        return "••••••••••" + accNum.substring(accNum.length() - 4);
    }
}
