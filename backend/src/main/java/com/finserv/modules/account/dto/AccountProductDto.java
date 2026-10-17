package com.finserv.modules.account.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.util.UUID;

public class AccountProductDto {
    private UUID id;
    private String productCode;
    private String productName;
    private String productType;
    private String currency;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal minBalance;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal interestRatePercentage;
    private boolean overdraftAllowed;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal overdraftLimit;
    private boolean isActive;

    public AccountProductDto() {
    }

    public AccountProductDto(UUID id, String productCode, String productName, String productType,
                             String currency, BigDecimal minBalance, BigDecimal interestRatePercentage,
                             boolean overdraftAllowed, BigDecimal overdraftLimit, boolean isActive) {
        this.id = id;
        this.productCode = productCode;
        this.productName = productName;
        this.productType = productType;
        this.currency = currency;
        this.minBalance = minBalance;
        this.interestRatePercentage = interestRatePercentage;
        this.overdraftAllowed = overdraftAllowed;
        this.overdraftLimit = overdraftLimit;
        this.isActive = isActive;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductType() {
        return productType;
    }

    public void setProductType(String productType) {
        this.productType = productType;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getMinBalance() {
        return minBalance;
    }

    public void setMinBalance(BigDecimal minBalance) {
        this.minBalance = minBalance;
    }

    public BigDecimal getInterestRatePercentage() {
        return interestRatePercentage;
    }

    public void setInterestRatePercentage(BigDecimal interestRatePercentage) {
        this.interestRatePercentage = interestRatePercentage;
    }

    public boolean isOverdraftAllowed() {
        return overdraftAllowed;
    }

    public void setOverdraftAllowed(boolean overdraftAllowed) {
        this.overdraftAllowed = overdraftAllowed;
    }

    public BigDecimal getOverdraftLimit() {
        return overdraftLimit;
    }

    public void setOverdraftLimit(BigDecimal overdraftLimit) {
        this.overdraftLimit = overdraftLimit;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
