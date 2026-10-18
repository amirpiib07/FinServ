package com.finserv.modules.dashboard.dto;

import com.finserv.modules.account.dto.AccountDto;
import com.finserv.modules.beneficiary.dto.BeneficiaryDto;
import com.finserv.modules.transaction.dto.TransactionDto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CustomerDashboardDto {

    private BigDecimal totalNetWorth = BigDecimal.ZERO.setScale(2);
    private int activeAccountsCount = 0;
    private int verifiedBeneficiariesCount = 0;
    private BigDecimal monthlyCredits = BigDecimal.ZERO.setScale(2);
    private BigDecimal monthlyDebits = BigDecimal.ZERO.setScale(2);
    private BigDecimal netCashflow30d = BigDecimal.ZERO.setScale(2);
    private AccountDto primaryAccount;
    private List<AccountDto> accounts = new ArrayList<>();
    private List<TransactionDto> recentTransactions = new ArrayList<>();
    private List<DashboardAlertDto> alerts = new ArrayList<>();
    private List<BeneficiaryDto> topBeneficiaries = new ArrayList<>();

    public CustomerDashboardDto() {
    }

    public BigDecimal getTotalNetWorth() {
        return totalNetWorth;
    }

    public void setTotalNetWorth(BigDecimal totalNetWorth) {
        this.totalNetWorth = totalNetWorth;
    }

    public int getActiveAccountsCount() {
        return activeAccountsCount;
    }

    public void setActiveAccountsCount(int activeAccountsCount) {
        this.activeAccountsCount = activeAccountsCount;
    }

    public int getVerifiedBeneficiariesCount() {
        return verifiedBeneficiariesCount;
    }

    public void setVerifiedBeneficiariesCount(int verifiedBeneficiariesCount) {
        this.verifiedBeneficiariesCount = verifiedBeneficiariesCount;
    }

    public BigDecimal getMonthlyCredits() {
        return monthlyCredits;
    }

    public void setMonthlyCredits(BigDecimal monthlyCredits) {
        this.monthlyCredits = monthlyCredits;
    }

    public BigDecimal getMonthlyDebits() {
        return monthlyDebits;
    }

    public void setMonthlyDebits(BigDecimal monthlyDebits) {
        this.monthlyDebits = monthlyDebits;
    }

    public BigDecimal getNetCashflow30d() {
        return netCashflow30d;
    }

    public void setNetCashflow30d(BigDecimal netCashflow30d) {
        this.netCashflow30d = netCashflow30d;
    }

    public AccountDto getPrimaryAccount() {
        return primaryAccount;
    }

    public void setPrimaryAccount(AccountDto primaryAccount) {
        this.primaryAccount = primaryAccount;
    }

    public List<AccountDto> getAccounts() {
        return accounts;
    }

    public void setAccounts(List<AccountDto> accounts) {
        this.accounts = accounts;
    }

    public List<TransactionDto> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<TransactionDto> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }

    public List<DashboardAlertDto> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<DashboardAlertDto> alerts) {
        this.alerts = alerts;
    }

    public List<BeneficiaryDto> getTopBeneficiaries() {
        return topBeneficiaries;
    }

    public void setTopBeneficiaries(List<BeneficiaryDto> topBeneficiaries) {
        this.topBeneficiaries = topBeneficiaries;
    }
}
