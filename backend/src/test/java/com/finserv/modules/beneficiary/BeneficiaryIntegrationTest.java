package com.finserv.modules.beneficiary;

import com.finserv.common.exception.DuplicateResourceException;
import com.finserv.common.exception.ValidationException;
import com.finserv.modules.account.dto.CreateAccountApplicationRequest;
import com.finserv.modules.account.entity.AccountProduct;
import com.finserv.modules.account.repository.AccountProductRepository;
import com.finserv.modules.account.service.AccountService;
import com.finserv.modules.beneficiary.dto.BeneficiaryDto;
import com.finserv.modules.beneficiary.dto.CreateBeneficiaryRequest;
import com.finserv.modules.beneficiary.dto.VerifyBeneficiaryRequest;
import com.finserv.modules.beneficiary.service.BeneficiaryService;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.organization.entity.Branch;
import com.finserv.modules.organization.repository.BranchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BeneficiaryIntegrationTest {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccountProductRepository accountProductRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UserRepository userRepository;

    private User userA;
    private User userB;
    private String userAAccountNumber;

    @BeforeEach
    void setUp() {
        userA = new User();
        userA.setUsername("benef_a_" + System.currentTimeMillis());
        userA.setEmail("benef_a_" + System.currentTimeMillis() + "@finserv.local");
        userA.setPhoneNumber("+9191" + (long)(Math.random() * 90000000L + 10000000L));
        userA.setPasswordHash("hashed_pass");
        userA.setStatus("ACTIVE");
        userA = userRepository.save(userA);

        userB = new User();
        userB.setUsername("benef_b_" + System.currentTimeMillis());
        userB.setEmail("benef_b_" + System.currentTimeMillis() + "@finserv.local");
        userB.setPhoneNumber("+9192" + (long)(Math.random() * 90000000L + 10000000L));
        userB.setPasswordHash("hashed_pass");
        userB.setStatus("ACTIVE");
        userB = userRepository.save(userB);

        AccountProduct product = accountProductRepository.findByProductCode("01").orElseThrow();
        Branch branch = branchRepository.findByBranchCode("1001").orElseThrow();

        CreateAccountApplicationRequest openReq = new CreateAccountApplicationRequest();
        openReq.setProductId(product.getId());
        openReq.setBranchId(branch.getId());
        openReq.setInitialDepositAmount(new BigDecimal("1000.00"));
        openReq.setAutoActivate(true);

        accountService.applyForAccount(userA.getId(), openReq);
        userAAccountNumber = accountService.getCustomerAccounts(userA.getId()).get(0).getAccountNumber();
    }

    @Test
    @DisplayName("Should detect internal FinServ account and create INTRA_BANK beneficiary in PENDING_VERIFICATION")
    void shouldCreateIntraBankBeneficiary() {
        CreateBeneficiaryRequest req = new CreateBeneficiaryRequest();
        req.setNickname("Amit Singh");
        req.setBeneficiaryName("Amit Kumar Singh");
        req.setAccountNumber(userAAccountNumber);
        req.setConfirmAccountNumber(userAAccountNumber);
        req.setIfscCode("FINS0001001");
        req.setBankName("FINServ Bank");
        req.setDailyTransferLimit(new BigDecimal("50000.00"));

        BeneficiaryDto created = beneficiaryService.addBeneficiary(userB.getId(), req);

        assertThat(created).isNotNull();
        assertThat(created.getPayeeType()).isEqualTo("INTRA_BANK");
        assertThat(created.getVerificationStatus()).isEqualTo("PENDING_VERIFICATION");
        assertThat(created.getMaskedAccountNumber()).startsWith("••••••••••");
        assertThat(created.getCoolingOffUntil()).isNotNull();
    }

    @Test
    @DisplayName("Should create INTER_BANK beneficiary for external bank with valid IFSC")
    void shouldCreateInterBankBeneficiary() {
        CreateBeneficiaryRequest req = new CreateBeneficiaryRequest();
        req.setNickname("External Friend");
        req.setBeneficiaryName("Rohan Verma");
        req.setAccountNumber("50100223344556");
        req.setConfirmAccountNumber("50100223344556");
        req.setIfscCode("HDFC0001234");
        req.setBankName("HDFC Bank");

        BeneficiaryDto created = beneficiaryService.addBeneficiary(userB.getId(), req);

        assertThat(created).isNotNull();
        assertThat(created.getPayeeType()).isEqualTo("INTER_BANK");
        assertThat(created.getVerificationStatus()).isEqualTo("PENDING_VERIFICATION");
    }

    @Test
    @DisplayName("Should prevent customer from adding their own FinServ account as a beneficiary")
    void shouldRejectSelfBeneficiary() {
        CreateBeneficiaryRequest req = new CreateBeneficiaryRequest();
        req.setNickname("Myself");
        req.setBeneficiaryName("Myself Self");
        req.setAccountNumber(userAAccountNumber);
        req.setConfirmAccountNumber(userAAccountNumber);
        req.setIfscCode("FINS0001001");
        req.setBankName("FINServ Bank");

        assertThatThrownBy(() -> beneficiaryService.addBeneficiary(userA.getId(), req))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("cannot add your own FinServ account");
    }

    @Test
    @DisplayName("Should reject duplicate active beneficiary for same account number and IFSC code")
    void shouldRejectDuplicateBeneficiary() {
        CreateBeneficiaryRequest req = new CreateBeneficiaryRequest();
        req.setNickname("Vendor A");
        req.setBeneficiaryName("Vendor Services");
        req.setAccountNumber("987654321012");
        req.setConfirmAccountNumber("987654321012");
        req.setIfscCode("SBIN0001234");
        req.setBankName("State Bank of India");

        beneficiaryService.addBeneficiary(userA.getId(), req);

        CreateBeneficiaryRequest duplicate = new CreateBeneficiaryRequest();
        duplicate.setNickname("Vendor A Second");
        duplicate.setBeneficiaryName("Vendor Services");
        duplicate.setAccountNumber("987654321012");
        duplicate.setConfirmAccountNumber("987654321012");
        duplicate.setIfscCode("SBIN0001234");
        duplicate.setBankName("State Bank of India");

        assertThatThrownBy(() -> beneficiaryService.addBeneficiary(userA.getId(), duplicate))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("Should verify beneficiary with OTP and transition status to VERIFIED")
    void shouldVerifyBeneficiaryWithOtp() {
        CreateBeneficiaryRequest req = new CreateBeneficiaryRequest();
        req.setNickname("Verified Payee");
        req.setBeneficiaryName("Sunil Sharma");
        req.setAccountNumber("123456789012");
        req.setConfirmAccountNumber("123456789012");
        req.setIfscCode("ICIC0000001");
        req.setBankName("ICICI Bank");

        BeneficiaryDto created = beneficiaryService.addBeneficiary(userA.getId(), req);
        assertThat(created.getVerificationStatus()).isEqualTo("PENDING_VERIFICATION");

        VerifyBeneficiaryRequest verifyReq = new VerifyBeneficiaryRequest("123456");
        BeneficiaryDto verified = beneficiaryService.verifyBeneficiary(created.getId(), userA.getId(), verifyReq);

        assertThat(verified.getVerificationStatus()).isEqualTo("VERIFIED");
    }

    @Test
    @DisplayName("Should soft-delete and deactivate beneficiary")
    void shouldDeactivateBeneficiary() {
        CreateBeneficiaryRequest req = new CreateBeneficiaryRequest();
        req.setNickname("Old Landlord");
        req.setBeneficiaryName("Rajesh Patel");
        req.setAccountNumber("998877665544");
        req.setConfirmAccountNumber("998877665544");
        req.setIfscCode("PUNB0001234");
        req.setBankName("Punjab National Bank");

        BeneficiaryDto created = beneficiaryService.addBeneficiary(userA.getId(), req);
        List<BeneficiaryDto> listBefore = beneficiaryService.getCustomerBeneficiaries(userA.getId());
        assertThat(listBefore).hasSize(1);

        beneficiaryService.deleteBeneficiary(created.getId(), userA.getId());

        List<BeneficiaryDto> listAfter = beneficiaryService.getCustomerBeneficiaries(userA.getId());
        assertThat(listAfter).isEmpty();
    }
}
