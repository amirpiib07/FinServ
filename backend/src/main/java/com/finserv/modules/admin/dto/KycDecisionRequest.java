package com.finserv.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class KycDecisionRequest {

    @NotBlank(message = "Decision is mandatory (APPROVE or REJECT)")
    @Pattern(regexp = "^(APPROVE|REJECT)$", message = "Decision must be either APPROVE or REJECT")
    private String decision;

    @NotBlank(message = "Remarks are mandatory for review decisions")
    private String remarks;

    public KycDecisionRequest() {
    }

    public KycDecisionRequest(String decision, String remarks) {
        this.decision = decision;
        this.remarks = remarks;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
