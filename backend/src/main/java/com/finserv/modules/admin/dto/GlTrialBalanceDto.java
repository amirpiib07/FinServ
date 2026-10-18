package com.finserv.modules.admin.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class GlTrialBalanceDto {

    private List<GlAccountTrialDto> accounts = new ArrayList<>();
    private BigDecimal grandTotalDebits = BigDecimal.ZERO.setScale(2);
    private BigDecimal grandTotalCredits = BigDecimal.ZERO.setScale(2);
    private boolean balanced = true;

    public GlTrialBalanceDto() {
    }

    public GlTrialBalanceDto(List<GlAccountTrialDto> accounts, BigDecimal grandTotalDebits,
                             BigDecimal grandTotalCredits, boolean balanced) {
        this.accounts = accounts;
        this.grandTotalDebits = grandTotalDebits;
        this.grandTotalCredits = grandTotalCredits;
        this.balanced = balanced;
    }

    public List<GlAccountTrialDto> getAccounts() {
        return accounts;
    }

    public void setAccounts(List<GlAccountTrialDto> accounts) {
        this.accounts = accounts;
    }

    public BigDecimal getGrandTotalDebits() {
        return grandTotalDebits;
    }

    public void setGrandTotalDebits(BigDecimal grandTotalDebits) {
        this.grandTotalDebits = grandTotalDebits;
    }

    public BigDecimal getGrandTotalCredits() {
        return grandTotalCredits;
    }

    public void setGrandTotalCredits(BigDecimal grandTotalCredits) {
        this.grandTotalCredits = grandTotalCredits;
    }

    public boolean isBalanced() {
        return balanced;
    }

    public void setBalanced(boolean balanced) {
        this.balanced = balanced;
    }
}
