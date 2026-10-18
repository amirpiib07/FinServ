package com.finserv.modules.admin.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class GlAccountTrialDto {

    private UUID id;
    private String glCode;
    private String accountName;
    private String accountType; // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    private String balanceSide; // DEBIT, CREDIT
    private BigDecimal totalDebits;
    private BigDecimal totalCredits;
    private BigDecimal netBalance;

    public GlAccountTrialDto() {
    }

    public GlAccountTrialDto(UUID id, String glCode, String accountName, String accountType,
                             String balanceSide, BigDecimal totalDebits, BigDecimal totalCredits, BigDecimal netBalance) {
        this.id = id;
        this.glCode = glCode;
        this.accountName = accountName;
        this.accountType = accountType;
        this.balanceSide = balanceSide;
        this.totalDebits = totalDebits;
        this.totalCredits = totalCredits;
        this.netBalance = netBalance;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getGlCode() {
        return glCode;
    }

    public void setGlCode(String glCode) {
        this.glCode = glCode;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getBalanceSide() {
        return balanceSide;
    }

    public void setBalanceSide(String balanceSide) {
        this.balanceSide = balanceSide;
    }

    public BigDecimal getTotalDebits() {
        return totalDebits;
    }

    public void setTotalDebits(BigDecimal totalDebits) {
        this.totalDebits = totalDebits;
    }

    public BigDecimal getTotalCredits() {
        return totalCredits;
    }

    public void setTotalCredits(BigDecimal totalCredits) {
        this.totalCredits = totalCredits;
    }

    public BigDecimal getNetBalance() {
        return netBalance;
    }

    public void setNetBalance(BigDecimal netBalance) {
        this.netBalance = netBalance;
    }
}
