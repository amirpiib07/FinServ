package com.finserv.modules.transaction.dto;

import java.math.BigDecimal;

public class TransactionSummaryDto {

    private BigDecimal totalCredits = BigDecimal.ZERO.setScale(2);
    private BigDecimal totalDebits = BigDecimal.ZERO.setScale(2);
    private BigDecimal netCashflow = BigDecimal.ZERO.setScale(2);
    private long transactionCount = 0L;

    public TransactionSummaryDto() {
    }

    public TransactionSummaryDto(BigDecimal totalCredits, BigDecimal totalDebits, BigDecimal netCashflow, long transactionCount) {
        this.totalCredits = totalCredits;
        this.totalDebits = totalDebits;
        this.netCashflow = netCashflow;
        this.transactionCount = transactionCount;
    }

    public BigDecimal getTotalCredits() {
        return totalCredits;
    }

    public void setTotalCredits(BigDecimal totalCredits) {
        this.totalCredits = totalCredits;
    }

    public BigDecimal getTotalDebits() {
        return totalDebits;
    }

    public void setTotalDebits(BigDecimal totalDebits) {
        this.totalDebits = totalDebits;
    }

    public BigDecimal getNetCashflow() {
        return netCashflow;
    }

    public void setNetCashflow(BigDecimal netCashflow) {
        this.netCashflow = netCashflow;
    }

    public long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(long transactionCount) {
        this.transactionCount = transactionCount;
    }
}
