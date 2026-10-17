package com.finserv.modules.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class WithdrawRequest {

    @NotNull(message = "Source account ID is required")
    private UUID accountId;

    @NotNull(message = "Withdrawal amount is required")
    @DecimalMin(value = "1.00", message = "Minimum withdrawal amount is ₹1.00")
    private BigDecimal amount;

    private String description;

    public WithdrawRequest() {
    }

    public WithdrawRequest(UUID accountId, BigDecimal amount, String description) {
        this.accountId = accountId;
        this.amount = amount;
        this.description = description;
    }

    public UUID getAccountId() {
        return accountId;
    }

    public void setAccountId(UUID accountId) {
        this.accountId = accountId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
