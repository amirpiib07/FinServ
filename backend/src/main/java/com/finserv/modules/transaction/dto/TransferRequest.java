package com.finserv.modules.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class TransferRequest {

    @NotNull(message = "Source account ID is required")
    private UUID fromAccountId;

    private String transferType = "BENEFICIARY"; // "BENEFICIARY", "SELF", "DIRECT_ACCOUNT"

    private UUID beneficiaryId;

    private String destinationAccountNumber;

    private String transferMode = "IMPS"; // "INTERNAL", "IMPS", "NEFT", "RTGS"

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(value = "1.00", message = "Minimum transfer amount is ₹1.00")
    private BigDecimal amount;

    private String description;

    public TransferRequest() {
    }

    public TransferRequest(UUID fromAccountId, String transferType, UUID beneficiaryId,
                           String destinationAccountNumber, String transferMode,
                           BigDecimal amount, String description) {
        this.fromAccountId = fromAccountId;
        this.transferType = transferType;
        this.beneficiaryId = beneficiaryId;
        this.destinationAccountNumber = destinationAccountNumber;
        this.transferMode = transferMode;
        this.amount = amount;
        this.description = description;
    }

    public UUID getFromAccountId() {
        return fromAccountId;
    }

    public void setFromAccountId(UUID fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public String getTransferType() {
        return transferType;
    }

    public void setTransferType(String transferType) {
        this.transferType = transferType;
    }

    public UUID getBeneficiaryId() {
        return beneficiaryId;
    }

    public void setBeneficiaryId(UUID beneficiaryId) {
        this.beneficiaryId = beneficiaryId;
    }

    public String getDestinationAccountNumber() {
        return destinationAccountNumber;
    }

    public void setDestinationAccountNumber(String destinationAccountNumber) {
        this.destinationAccountNumber = destinationAccountNumber;
    }

    public String getTransferMode() {
        return transferMode;
    }

    public void setTransferMode(String transferMode) {
        this.transferMode = transferMode;
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
