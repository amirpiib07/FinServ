package com.finserv.modules.account.entity;

import com.finserv.common.model.BaseEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_products")
public class AccountProduct extends BaseEntity {

    @Column(name = "product_code", length = 2, nullable = false, unique = true)
    private String productCode;

    @Column(name = "product_name", length = 80, nullable = false)
    private String productName;

    @Column(name = "product_type", length = 30, nullable = false)
    private String productType;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "gl_account_id", length = 36, nullable = false)
    private UUID glAccountId;

    @Column(name = "currency", length = 3, nullable = false)
    private String currency = "INR";

    @Column(name = "min_balance", precision = 15, scale = 2, nullable = false)
    private BigDecimal minBalance = BigDecimal.ZERO.setScale(2);

    @Column(name = "interest_rate_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal interestRatePercentage = BigDecimal.ZERO.setScale(2);

    @Column(name = "overdraft_allowed", nullable = false)
    private boolean overdraftAllowed = false;

    @Column(name = "overdraft_limit", precision = 15, scale = 2, nullable = false)
    private BigDecimal overdraftLimit = BigDecimal.ZERO.setScale(2);

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AccountProduct() {
        super();
    }

    public AccountProduct(UUID id) {
        super(id);
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

    public UUID getGlAccountId() {
        return glAccountId;
    }

    public void setGlAccountId(UUID glAccountId) {
        this.glAccountId = glAccountId;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
