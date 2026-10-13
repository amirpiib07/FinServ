package com.finserv.modules.onboarding.entity;

import com.finserv.common.model.AuditableEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "customers")
public class Customer extends AuditableEntity {

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", length = 36, nullable = false, unique = true)
    private UUID userId;

    @Column(name = "customer_number", length = 20, nullable = false, unique = true)
    private String customerNumber;

    @Column(name = "first_name", length = 60, nullable = false)
    private String firstName;

    @Column(name = "middle_name", length = 60)
    private String middleName;

    @Column(name = "last_name", length = 60, nullable = false)
    private String lastName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 20, nullable = false)
    private String gender;

    @Column(name = "marital_status", length = 20)
    private String maritalStatus;

    @Column(name = "nationality", length = 50, nullable = false)
    private String nationality = "INDIAN";

    @Column(name = "tax_identifier_encrypted", length = 512, nullable = false)
    private String taxIdentifierEncrypted;

    @Column(name = "tax_identifier_hash", length = 64, nullable = false, unique = true)
    private String taxIdentifierHash;

    @Column(name = "key_version", nullable = false)
    private int keyVersion = 1;

    @Column(name = "kyc_status", length = 30, nullable = false)
    private String kycStatus = "VERIFIED";

    @Column(name = "kyc_tier", length = 20, nullable = false)
    private String kycTier = "TIER_1";

    public Customer() {
        super();
    }

    public Customer(UUID id) {
        super(id);
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getCustomerNumber() {
        return customerNumber;
    }

    public void setCustomerNumber(String customerNumber) {
        this.customerNumber = customerNumber;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getMiddleName() {
        return middleName;
    }

    public void setMiddleName(String middleName) {
        this.middleName = middleName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getMaritalStatus() {
        return maritalStatus;
    }

    public void setMaritalStatus(String maritalStatus) {
        this.maritalStatus = maritalStatus;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getTaxIdentifierEncrypted() {
        return taxIdentifierEncrypted;
    }

    public void setTaxIdentifierEncrypted(String taxIdentifierEncrypted) {
        this.taxIdentifierEncrypted = taxIdentifierEncrypted;
    }

    public String getTaxIdentifierHash() {
        return taxIdentifierHash;
    }

    public void setTaxIdentifierHash(String taxIdentifierHash) {
        this.taxIdentifierHash = taxIdentifierHash;
    }

    public int getKeyVersion() {
        return keyVersion;
    }

    public void setKeyVersion(int keyVersion) {
        this.keyVersion = keyVersion;
    }

    public String getKycStatus() {
        return kycStatus;
    }

    public void setKycStatus(String kycStatus) {
        this.kycStatus = kycStatus;
    }

    public String getKycTier() {
        return kycTier;
    }

    public void setKycTier(String kycTier) {
        this.kycTier = kycTier;
    }
}
