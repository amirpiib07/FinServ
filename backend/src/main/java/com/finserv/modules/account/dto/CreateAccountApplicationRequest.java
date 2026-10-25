package com.finserv.modules.account.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public class CreateAccountApplicationRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    @NotNull(message = "Branch ID is required")
    private UUID branchId;

    @DecimalMin(value = "0.00", message = "Initial deposit amount cannot be negative")
    private BigDecimal initialDepositAmount = new BigDecimal("5000.00");

    @Size(max = 60, message = "Account nickname cannot exceed 60 characters")
    private String nickname;

    private boolean autoActivate = true;

    public CreateAccountApplicationRequest() {
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    public BigDecimal getInitialDepositAmount() {
        return initialDepositAmount;
    }

    public void setInitialDepositAmount(BigDecimal initialDepositAmount) {
        this.initialDepositAmount = initialDepositAmount;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public boolean isAutoActivate() {
        return autoActivate;
    }

    public void setAutoActivate(boolean autoActivate) {
        this.autoActivate = autoActivate;
    }
}
