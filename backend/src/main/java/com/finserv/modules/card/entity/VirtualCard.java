package com.finserv.modules.card.entity;

import com.finserv.common.model.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "virtual_cards")
public class VirtualCard extends AuditableEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "account_id", length = 36, nullable = false, unique = true)
    private UUID accountId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "customer_id", length = 36, nullable = false)
    private UUID customerId;

    @Column(name = "card_number_masked", length = 24, nullable = false)
    private String cardNumberMasked;

    @Column(name = "card_number_last4", length = 4, nullable = false)
    private String cardNumberLast4;

    @Column(name = "card_network", length = 20, nullable = false)
    private String cardNetwork = "VISA";

    @Column(name = "card_type", length = 30, nullable = false)
    private String cardType = "PLATINUM_VIRTUAL_DEBIT";

    @Column(name = "cardholder_name", length = 100, nullable = false)
    private String cardholderName;

    @Column(name = "expiry_month", nullable = false)
    private int expiryMonth;

    @Column(name = "expiry_year", nullable = false)
    private int expiryYear;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "online_transactions_enabled", nullable = false)
    private boolean onlineTransactionsEnabled = true;

    @Column(name = "contactless_enabled", nullable = false)
    private boolean contactlessEnabled = true;

    @Column(name = "international_enabled", nullable = false)
    private boolean internationalEnabled = false;

    @Column(name = "daily_spend_limit", precision = 15, scale = 2, nullable = false)
    private BigDecimal dailySpendLimit = new BigDecimal("50000.00");

    public VirtualCard() {
        super();
    }

    public VirtualCard(UUID id) {
        super(id);
    }

    public UUID getAccountId() {
        return accountId;
    }

    public void setAccountId(UUID accountId) {
        this.accountId = accountId;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getCardNumberMasked() {
        return cardNumberMasked;
    }

    public void setCardNumberMasked(String cardNumberMasked) {
        this.cardNumberMasked = cardNumberMasked;
    }

    public String getCardNumberLast4() {
        return cardNumberLast4;
    }

    public void setCardNumberLast4(String cardNumberLast4) {
        this.cardNumberLast4 = cardNumberLast4;
    }

    public String getCardNetwork() {
        return cardNetwork;
    }

    public void setCardNetwork(String cardNetwork) {
        this.cardNetwork = cardNetwork;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(String cardType) {
        this.cardType = cardType;
    }

    public String getCardholderName() {
        return cardholderName;
    }

    public void setCardholderName(String cardholderName) {
        this.cardholderName = cardholderName;
    }

    public int getExpiryMonth() {
        return expiryMonth;
    }

    public void setExpiryMonth(int expiryMonth) {
        this.expiryMonth = expiryMonth;
    }

    public int getExpiryYear() {
        return expiryYear;
    }

    public void setExpiryYear(int expiryYear) {
        this.expiryYear = expiryYear;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isOnlineTransactionsEnabled() {
        return onlineTransactionsEnabled;
    }

    public void setOnlineTransactionsEnabled(boolean onlineTransactionsEnabled) {
        this.onlineTransactionsEnabled = onlineTransactionsEnabled;
    }

    public boolean isContactlessEnabled() {
        return contactlessEnabled;
    }

    public void setContactlessEnabled(boolean contactlessEnabled) {
        this.contactlessEnabled = contactlessEnabled;
    }

    public boolean isInternationalEnabled() {
        return internationalEnabled;
    }

    public void setInternationalEnabled(boolean internationalEnabled) {
        this.internationalEnabled = internationalEnabled;
    }

    public BigDecimal getDailySpendLimit() {
        return dailySpendLimit;
    }

    public void setDailySpendLimit(BigDecimal dailySpendLimit) {
        this.dailySpendLimit = dailySpendLimit;
    }
}
