package com.finserv.modules.transaction.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class TransactionReceiptDto {

    private UUID id;
    private String transactionReference;
    private String status;
    private String transactionType;
    private String transferMode;
    private BigDecimal amount;
    private BigDecimal feeAmount;
    private String currency;
    private UUID fromAccountId;
    private String fromAccountNumber;
    private String fromAccountHolderName;
    private String fromAccountBranch;
    private String fromAccountIfsc;
    private UUID toAccountId;
    private String toAccountNumber;
    private String toAccountHolderName;
    private String toBankName;
    private String toIfscCode;
    private BigDecimal runningBalance;
    private BigDecimal fromAccountBalanceAfter;
    private BigDecimal toAccountBalanceAfter;
    private String description;
    private String channel;
    private Instant createdAt;
    private Instant completedAt;
    private String journalReference;

    public TransactionReceiptDto() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
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

    public BigDecimal getFeeAmount() {
        return feeAmount;
    }

    public void setFeeAmount(BigDecimal feeAmount) {
        this.feeAmount = feeAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public UUID getFromAccountId() {
        return fromAccountId;
    }

    public void setFromAccountId(UUID fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public String getFromAccountNumber() {
        return fromAccountNumber;
    }

    public void setFromAccountNumber(String fromAccountNumber) {
        this.fromAccountNumber = fromAccountNumber;
    }

    public String getFromAccountHolderName() {
        return fromAccountHolderName;
    }

    public void setFromAccountHolderName(String fromAccountHolderName) {
        this.fromAccountHolderName = fromAccountHolderName;
    }

    public String getFromAccountBranch() {
        return fromAccountBranch;
    }

    public void setFromAccountBranch(String fromAccountBranch) {
        this.fromAccountBranch = fromAccountBranch;
    }

    public String getFromAccountIfsc() {
        return fromAccountIfsc;
    }

    public void setFromAccountIfsc(String fromAccountIfsc) {
        this.fromAccountIfsc = fromAccountIfsc;
    }

    public UUID getToAccountId() {
        return toAccountId;
    }

    public void setToAccountId(UUID toAccountId) {
        this.toAccountId = toAccountId;
    }

    public String getToAccountNumber() {
        return toAccountNumber;
    }

    public void setToAccountNumber(String toAccountNumber) {
        this.toAccountNumber = toAccountNumber;
    }

    public String getToAccountHolderName() {
        return toAccountHolderName;
    }

    public void setToAccountHolderName(String toAccountHolderName) {
        this.toAccountHolderName = toAccountHolderName;
    }

    public String getToBankName() {
        return toBankName;
    }

    public void setToBankName(String toBankName) {
        this.toBankName = toBankName;
    }

    public String getToIfscCode() {
        return toIfscCode;
    }

    public void setToIfscCode(String toIfscCode) {
        this.toIfscCode = toIfscCode;
    }

    public BigDecimal getRunningBalance() {
        return runningBalance;
    }

    public void setRunningBalance(BigDecimal runningBalance) {
        this.runningBalance = runningBalance;
    }

    public BigDecimal getFromAccountBalanceAfter() {
        return fromAccountBalanceAfter;
    }

    public void setFromAccountBalanceAfter(BigDecimal fromAccountBalanceAfter) {
        this.fromAccountBalanceAfter = fromAccountBalanceAfter;
    }

    public BigDecimal getToAccountBalanceAfter() {
        return toAccountBalanceAfter;
    }

    public void setToAccountBalanceAfter(BigDecimal toAccountBalanceAfter) {
        this.toAccountBalanceAfter = toAccountBalanceAfter;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public String getJournalReference() {
        return journalReference;
    }

    public void setJournalReference(String journalReference) {
        this.journalReference = journalReference;
    }
}
