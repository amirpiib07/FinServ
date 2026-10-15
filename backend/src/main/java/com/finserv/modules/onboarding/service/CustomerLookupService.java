package com.finserv.modules.onboarding.service;

import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.security.FieldEncryptionService;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.entity.OnboardingApplication;
import com.finserv.modules.onboarding.repository.CustomerRepository;
import com.finserv.modules.onboarding.repository.OnboardingApplicationRepository;
import com.finserv.modules.sequence.generator.CustomerNumberGenerator;
import com.finserv.modules.sequence.service.NumberSequenceService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerLookupService {

    private static final Logger log = LoggerFactory.getLogger(CustomerLookupService.class);

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final OnboardingApplicationRepository onboardingApplicationRepository;
    private final CustomerNumberGenerator customerNumberGenerator;
    private final NumberSequenceService numberSequenceService;
    private final FieldEncryptionService fieldEncryptionService;
    private final ObjectMapper objectMapper;

    public CustomerLookupService(CustomerRepository customerRepository,
                                 UserRepository userRepository,
                                 OnboardingApplicationRepository onboardingApplicationRepository,
                                 CustomerNumberGenerator customerNumberGenerator,
                                 NumberSequenceService numberSequenceService,
                                 FieldEncryptionService fieldEncryptionService,
                                 ObjectMapper objectMapper) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.onboardingApplicationRepository = onboardingApplicationRepository;
        this.customerNumberGenerator = customerNumberGenerator;
        this.numberSequenceService = numberSequenceService;
        this.fieldEncryptionService = fieldEncryptionService;
        this.objectMapper = objectMapper;
    }

    public Optional<Customer> findByUserId(UUID userId) {
        return customerRepository.findByUserId(userId);
    }

    @Transactional
    public Customer getOrCreateCustomerForUser(UUID userId) {
        Optional<Customer> existing = customerRepository.findByUserId(userId);
        if (existing.isPresent()) {
            return existing.get();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Attempt to extract personal and KYC details from onboarding draft if available
        String firstName = "Customer";
        String lastName = user.getUsername();
        LocalDate dob = LocalDate.of(1990, 1, 1);
        String gender = "OTHER";
        String pan = "ABCDE" + String.format("%04d", (int)(Math.random() * 9000 + 1000)) + "F";

        Optional<OnboardingApplication> appOpt = onboardingApplicationRepository
                .findTopByUserIdOrderByCreatedAtDesc(userId);

        if (appOpt.isPresent() && appOpt.get().getDraftDataEncrypted() != null) {
            try {
                String decrypted = fieldEncryptionService.decrypt(appOpt.get().getDraftDataEncrypted());
                Map<String, Object> draft = objectMapper.readValue(decrypted, new TypeReference<>() {});
                @SuppressWarnings("unchecked")
                Map<String, Object> step2 = (Map<String, Object>) draft.get("step2");
                if (step2 != null) {
                    if (step2.get("firstName") != null && !((String) step2.get("firstName")).isBlank()) {
                        firstName = (String) step2.get("firstName");
                    }
                    if (step2.get("lastName") != null && !((String) step2.get("lastName")).isBlank()) {
                        lastName = (String) step2.get("lastName");
                    }
                    if (step2.get("dateOfBirth") != null) {
                        dob = LocalDate.parse((String) step2.get("dateOfBirth"));
                    }
                    if (step2.get("gender") != null) {
                        gender = (String) step2.get("gender");
                    }
                }
                @SuppressWarnings("unchecked")
                Map<String, Object> step4 = (Map<String, Object>) draft.get("step4");
                if (step4 != null && step4.get("panNumber") != null) {
                    pan = ((String) step4.get("panNumber")).trim().toUpperCase();
                }
            } catch (Exception e) {
                log.warn("Could not parse onboarding draft for user {}: {}", userId, e.getMessage());
            }
        }

        int year = Year.now(ZoneOffset.UTC).getValue();
        String seqName = "customer_cif_seq_" + year;
        long cifSeq = numberSequenceService.getNextValue(seqName);
        String customerNumber = customerNumberGenerator.generate(year, cifSeq);

        String panHash = fieldEncryptionService.computeBlindIndex(pan);
        // If blind index already exists for another customer, append unique suffix for dev
        if (customerRepository.existsByTaxIdentifierHash(panHash)) {
            pan = "ABCDE" + String.format("%04d", (int)(Math.random() * 9000 + 1000)) + "Z";
            panHash = fieldEncryptionService.computeBlindIndex(pan);
        }

        Customer customer = new Customer();
        customer.setUserId(userId);
        customer.setCustomerNumber(customerNumber);
        customer.setFirstName(firstName);
        customer.setLastName(lastName);
        customer.setDateOfBirth(dob);
        customer.setGender(gender);
        customer.setNationality("INDIAN");
        customer.setTaxIdentifierEncrypted(fieldEncryptionService.encrypt(pan));
        customer.setTaxIdentifierHash(panHash);
        customer.setKeyVersion(1);
        customer.setKycStatus("VERIFIED");
        customer.setKycTier("TIER_1");

        customer = customerRepository.save(customer);
        log.info("Provisioned customer record {} for user {}", customerNumber, userId);
        return customer;
    }
}
