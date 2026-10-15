package com.finserv.modules.account.entity;

import com.finserv.common.model.BaseEntity;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gl_chart_of_accounts")
public class GlChartOfAccount extends BaseEntity {

    @Column(name = "gl_code", length = 30, nullable = false, unique = true)
    private String glCode;

    @Column(name = "account_name", length = 100, nullable = false)
    private String accountName;

    @Column(name = "account_type", length = 20, nullable = false)
    private String accountType;

    @Column(name = "balance_side", length = 10, nullable = false)
    private String balanceSide;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public GlChartOfAccount() {
        super();
    }

    public GlChartOfAccount(UUID id) {
        super(id);
    }

    public String getGlCode() {
        return glCode;
    }

    public void setGlCode(String glCode) {
        this.glCode = glCode;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getBalanceSide() {
        return balanceSide;
    }

    public void setBalanceSide(String balanceSide) {
        this.balanceSide = balanceSide;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
