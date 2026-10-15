package com.finserv.modules.onboarding.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class SaveStepRequest {

    @Min(value = 1, message = "Step must be between 1 and 5")
    @Max(value = 5, message = "Step must be between 1 and 5")
    private int step;

    @NotNull(message = "Step data cannot be null")
    private Map<String, Object> stepData;

    public SaveStepRequest() {
    }

    public SaveStepRequest(int step, Map<String, Object> stepData) {
        this.step = step;
        this.stepData = stepData;
    }

    public int getStep() {
        return step;
    }

    public void setStep(int step) {
        this.step = step;
    }

    public Map<String, Object> getStepData() {
        return stepData;
    }

    public void setStepData(Map<String, Object> stepData) {
        this.stepData = stepData;
    }
}
