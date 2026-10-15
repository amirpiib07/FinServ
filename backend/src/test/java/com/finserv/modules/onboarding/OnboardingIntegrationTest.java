package com.finserv.modules.onboarding;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finserv.modules.identity.dto.AuthResponse;
import com.finserv.modules.identity.dto.RegisterRequest;
import com.finserv.modules.onboarding.dto.SaveStepRequest;
import com.finserv.modules.onboarding.repository.AddressRepository;
import com.finserv.modules.onboarding.repository.CustomerDeclarationRepository;
import com.finserv.modules.onboarding.repository.KycDocumentRepository;
import com.finserv.modules.onboarding.repository.OnboardingApplicationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OnboardingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OnboardingApplicationRepository onboardingApplicationRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CustomerDeclarationRepository customerDeclarationRepository;

    @Autowired
    private KycDocumentRepository kycDocumentRepository;

    private String registerAndGetToken(String usernamePrefix) throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest req = new RegisterRequest(
                usernamePrefix + "_" + suffix,
                usernamePrefix + "_" + suffix + "@finserv.local",
                "+9198" + (10000000 + (int)(Math.random() * 89999999)),
                "SecureP@ss123!"
        );

        MvcResult res = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(res.getResponse().getContentAsString(), AuthResponse.class);
        return auth.getAccessToken();
    }

    @Test
    @DisplayName("Should initialize and step progressively through the onboarding application")
    void shouldStepProgressivelyThroughOnboarding() throws Exception {
        String token = registerAndGetToken("onboard");

        // 1. Get or initialize application
        MvcResult getResult = mockMvc.perform(get("/api/v1/onboarding/application")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.applicationReference").value(org.hamcrest.Matchers.startsWith("APP-")))
                .andExpect(jsonPath("$.currentStep").value(1))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();

        // 2. Step 1: Save Contact Verification
        SaveStepRequest step1Req = new SaveStepRequest(1, Map.of(
                "emailVerified", true,
                "phoneVerified", true
        ));
        mockMvc.perform(put("/api/v1/onboarding/application/step/1")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(step1Req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStep").value(2));

        // 3. Step 2: Save Personal Profile
        SaveStepRequest step2Req = new SaveStepRequest(2, Map.of(
                "firstName", "Aarav",
                "lastName", "Sharma",
                "dateOfBirth", "1994-08-20",
                "gender", "MALE",
                "maritalStatus", "SINGLE",
                "nationality", "INDIAN"
        ));
        mockMvc.perform(put("/api/v1/onboarding/application/step/2")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(step2Req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStep").value(3));

        // 4. Step 3: Save Residential Address & Declarations
        SaveStepRequest step3Req = new SaveStepRequest(3, Map.of(
                "streetLine1", "Flat 402, Nilgiri Heights",
                "city", "Mumbai",
                "state", "Maharashtra",
                "postalCode", "400001",
                "country", "India",
                "termsAccepted", true,
                "fatcaAccepted", true,
                "pepDeclared", true,
                "privacyAccepted", true
        ));
        mockMvc.perform(put("/api/v1/onboarding/application/step/3")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(step3Req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStep").value(4));

        // 5. Step 4: Save KYC Information
        String pan = "ABCDE" + (1000 + (int)(Math.random() * 8999)) + "F";
        SaveStepRequest step4Req = new SaveStepRequest(4, Map.of(
                "panNumber", pan,
                "idType", "PASSPORT",
                "idNumber", "Z" + (1000000 + (int)(Math.random() * 8999999))
        ));
        mockMvc.perform(put("/api/v1/onboarding/application/step/4")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(step4Req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStep").value(5));

        // 6. Submit Application
        MvcResult submitResult = mockMvc.perform(post("/api/v1/onboarding/application/submit")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.submittedAt").isNotEmpty())
                .andReturn();

        // 7. Verify /api/v1/auth/me now reflects SUBMITTED status
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingStatus").value("SUBMITTED"))
                .andExpect(jsonPath("$.customerVerified").value(false));
    }

    @Test
    @DisplayName("Should reject submission with duplicate PAN via HMAC-SHA256 blind index")
    void shouldRejectDuplicatePanSubmission() throws Exception {
        String token1 = registerAndGetToken("pan1");
        String token2 = registerAndGetToken("pan2");

        String sharedPan = "BKUPM" + (1000 + (int)(Math.random() * 8999)) + "Z";

        // User 1 setup and submit
        mockMvc.perform(get("/api/v1/onboarding/application").header("Authorization", "Bearer " + token1));
        mockMvc.perform(put("/api/v1/onboarding/application/step/1")
                .header("Authorization", "Bearer " + token1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SaveStepRequest(1, Map.of("emailVerified", true)))));
        mockMvc.perform(put("/api/v1/onboarding/application/step/2")
                .header("Authorization", "Bearer " + token1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SaveStepRequest(2, Map.of(
                        "firstName", "UserOne", "lastName", "Test", "dateOfBirth", "1992-01-01", "gender", "MALE")))));
        mockMvc.perform(put("/api/v1/onboarding/application/step/3")
                .header("Authorization", "Bearer " + token1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SaveStepRequest(3, Map.of(
                        "streetLine1", "St 1", "city", "Pune", "state", "MH", "postalCode", "411001",
                        "termsAccepted", true, "fatcaAccepted", true)))));
        mockMvc.perform(put("/api/v1/onboarding/application/step/4")
                .header("Authorization", "Bearer " + token1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SaveStepRequest(4, Map.of(
                        "panNumber", sharedPan, "idType", "PASSPORT", "idNumber", "P1234567")))));

        mockMvc.perform(post("/api/v1/onboarding/application/submit")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        // User 2 setup with SAME PAN
        mockMvc.perform(get("/api/v1/onboarding/application").header("Authorization", "Bearer " + token2));
        mockMvc.perform(put("/api/v1/onboarding/application/step/1")
                .header("Authorization", "Bearer " + token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SaveStepRequest(1, Map.of("emailVerified", true)))));
        mockMvc.perform(put("/api/v1/onboarding/application/step/2")
                .header("Authorization", "Bearer " + token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SaveStepRequest(2, Map.of(
                        "firstName", "UserTwo", "lastName", "Test", "dateOfBirth", "1993-01-01", "gender", "FEMALE")))));
        mockMvc.perform(put("/api/v1/onboarding/application/step/3")
                .header("Authorization", "Bearer " + token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SaveStepRequest(3, Map.of(
                        "streetLine1", "St 2", "city", "Delhi", "state", "DL", "postalCode", "110001",
                        "termsAccepted", true, "fatcaAccepted", true)))));
        mockMvc.perform(put("/api/v1/onboarding/application/step/4")
                .header("Authorization", "Bearer " + token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SaveStepRequest(4, Map.of(
                        "panNumber", sharedPan, "idType", "NATIONAL_ID", "idNumber", "890123456789")))));

        // User 2 submit must fail with 409 Conflict
        mockMvc.perform(post("/api/v1/onboarding/application/submit")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_RESOURCE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("PAN number is already under review")));
    }
}
