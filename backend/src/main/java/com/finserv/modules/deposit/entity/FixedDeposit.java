package com.finserv.modules.deposit.entity;

import com.finserv.common.model.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fixed_deposits")
public class FixedDeposit extends AuditableEntity {

    @Column(name = "deposit_number", length = 24, nullable = false, unique = true)
    private String depositNumber;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "customer_id", length = 36, nullable = false)
    private UUID customerId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "source_account_id", length = 36, nullable = false)
    private UUID sourceAccountId;

    @Column(name = "principal_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal principalAmount;

    @Column(name = "interest_rate_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal interestRatePercentage;

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "maturity_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal maturityAmount;

    @Column(name = "interest_earned", precision = 15, scale = 2, nullable = false)
    private BigDecimal interestEarned;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "maturity_date", nullable = false)
    private Instant maturityDate;

    public FixedDeposit() {
        super();
    }

    public FixedDeposit(UUID id) {
        super(id);
    }

    public String getDepositNumber() {
        return depositNumber;
    }

    public void setDepositNumber(String depositNumber) {
        this.depositNumber = depositNumber;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public UUID getSourceAccountId() {
        return sourceAccountId;
    }

    public void setSourceAccountId(UUID sourceAccountId) {
        this.sourceAccountId = sourceAccountId;
    }

    public BigDecimal getPrincipalAmount() {
        return principalAmount;
    }

    public void setPrincipalAmount(BigDecimal principalAmount) {
        this.principalAmount = principalAmount;
    }

    public BigDecimal getInterestRatePercentage() {
        return interestRatePercentage;
    }

    public void setInterestRatePercentage(BigDecimal interestRatePercentage) {
        this.interestRatePercentage = interestRatePercentage;
    }

    public Integer getTenureMonths() {
        return tenureMonths;
    }

    public void setTenureMonths(Integer tenureMonths) {
        this.tenureMonths = tenureMonths;
    }

    public BigDecimal getMaturityAmount() {
        return maturityAmount;
    }

    public void setMaturityAmount(BigDecimal maturityAmount) {
        this.maturityAmount = maturityAmount;
    }

    public BigDecimal getInterestEarned() {
        return interestEarned;
    }

    public void setInterestEarned(BigDecimal interestEarned) {
        this.interestEarned = interestEarned;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public void setStartDate(Instant startDate) {
        this.startDate = startDate;
    }

    public Instant getMaturityDate() {
        return maturityDate;
    }

    public void setMaturityDate(Instant maturityDate) {
        this.maturityDate = maturityDate;
    }
}
