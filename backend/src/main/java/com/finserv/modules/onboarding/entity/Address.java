package com.finserv.modules.onboarding.entity;

import com.finserv.common.model.BaseEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "addresses")
public class Address extends BaseEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "customer_id", length = 36)
    private UUID customerId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "application_id", length = 36)
    private UUID applicationId;

    @Column(name = "address_type", length = 30, nullable = false)
    private String addressType;

    @Column(name = "street_line_1", length = 120, nullable = false)
    private String streetLine1;

    @Column(name = "street_line_2", length = 120)
    private String streetLine2;

    @Column(name = "city", length = 60, nullable = false)
    private String city;

    @Column(name = "state", length = 60, nullable = false)
    private String state;

    @Column(name = "postal_code", length = 20, nullable = false)
    private String postalCode;

    @Column(name = "country", length = 60, nullable = false)
    private String country = "India";

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Address() {
        super();
    }

    public Address(UUID id) {
        super(id);
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }

    public String getAddressType() {
        return addressType;
    }

    public void setAddressType(String addressType) {
        this.addressType = addressType;
    }

    public String getStreetLine1() {
        return streetLine1;
    }

    public void setStreetLine1(String streetLine1) {
        this.streetLine1 = streetLine1;
    }

    public String getStreetLine2() {
        return streetLine2;
    }

    public void setStreetLine2(String streetLine2) {
        this.streetLine2 = streetLine2;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public boolean isPrimary() {
        return isPrimary;
    }

    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
