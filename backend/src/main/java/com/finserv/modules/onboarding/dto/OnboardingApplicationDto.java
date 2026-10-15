package com.finserv.modules.onboarding.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class OnboardingApplicationDto {

    private UUID id;
    private String applicationReference;
    private int currentStep;
    private String status;
    private Map<String, Object> draftData;
    private Instant submittedAt;
    private String rejectionReason;

    public OnboardingApplicationDto() {
    }

    public OnboardingApplicationDto(UUID id, String applicationReference, int currentStep,
                                    String status, Map<String, Object> draftData,
                                    Instant submittedAt, String rejectionReason) {
        this.id = id;
        this.applicationReference = applicationReference;
        this.currentStep = currentStep;
        this.status = status;
        this.draftData = draftData;
        this.submittedAt = submittedAt;
        this.rejectionReason = rejectionReason;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getApplicationReference() {
        return applicationReference;
    }

    public void setApplicationReference(String applicationReference) {
        this.applicationReference = applicationReference;
    }

    public int getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(int currentStep) {
        this.currentStep = currentStep;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, Object> getDraftData() {
        return draftData;
    }

    public void setDraftData(Map<String, Object> draftData) {
        this.draftData = draftData;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
