package com.finserv.modules.admin.dto;

import java.math.BigDecimal;

public class AdminOverviewDto {

    private long totalCustomers;
    private long pendingKycReviewsCount;
    private long pendingAccountApplicationsCount;
    private long totalActiveAccounts;
    private BigDecimal totalCustomerDeposits;
    private BigDecimal todayTransactionVolume;
    private long todayTransactionCount;
    private String glIntegrityStatus; // "BALANCED" or "UNBALANCED"
    private BigDecimal totalGlDebits;
    private BigDecimal totalGlCredits;

    public boolean isGlBalanced() {
        return "BALANCED".equalsIgnoreCase(glIntegrityStatus);
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getPendingKycReviewsCount() {
        return pendingKycReviewsCount;
    }

    public void setPendingKycReviewsCount(long pendingKycReviewsCount) {
        this.pendingKycReviewsCount = pendingKycReviewsCount;
    }

    public long getPendingAccountApplicationsCount() {
        return pendingAccountApplicationsCount;
    }

    public void setPendingAccountApplicationsCount(long pendingAccountApplicationsCount) {
        this.pendingAccountApplicationsCount = pendingAccountApplicationsCount;
    }

    public long getTotalActiveAccounts() {
        return totalActiveAccounts;
    }

    public void setTotalActiveAccounts(long totalActiveAccounts) {
        this.totalActiveAccounts = totalActiveAccounts;
    }

    public BigDecimal getTotalCustomerDeposits() {
        return totalCustomerDeposits;
    }

    public void setTotalCustomerDeposits(BigDecimal totalCustomerDeposits) {
        this.totalCustomerDeposits = totalCustomerDeposits;
    }

    public BigDecimal getTodayTransactionVolume() {
        return todayTransactionVolume;
    }

    public void setTodayTransactionVolume(BigDecimal todayTransactionVolume) {
        this.todayTransactionVolume = todayTransactionVolume;
    }

    public long getTodayTransactionCount() {
        return todayTransactionCount;
    }

    public void setTodayTransactionCount(long todayTransactionCount) {
        this.todayTransactionCount = todayTransactionCount;
    }

    public String getGlIntegrityStatus() {
        return glIntegrityStatus;
    }

    public void setGlIntegrityStatus(String glIntegrityStatus) {
        this.glIntegrityStatus = glIntegrityStatus;
    }

    public BigDecimal getTotalGlDebits() {
        return totalGlDebits;
    }

    public void setTotalGlDebits(BigDecimal totalGlDebits) {
        this.totalGlDebits = totalGlDebits;
    }

    public BigDecimal getTotalGlCredits() {
        return totalGlCredits;
    }

    public void setTotalGlCredits(BigDecimal totalGlCredits) {
        this.totalGlCredits = totalGlCredits;
    }
}
