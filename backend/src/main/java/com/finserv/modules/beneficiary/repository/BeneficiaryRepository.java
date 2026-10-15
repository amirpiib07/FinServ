package com.finserv.modules.beneficiary.repository;

import com.finserv.modules.beneficiary.entity.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, UUID> {

    List<Beneficiary> findByCustomerIdAndIsActiveTrueOrderByCreatedAtDesc(UUID customerId);

    Optional<Beneficiary> findByIdAndCustomerId(UUID id, UUID customerId);

    Optional<Beneficiary> findByCustomerIdAndAccountNumberAndIfscCode(UUID customerId, String accountNumber, String ifscCode);

    boolean existsByCustomerIdAndAccountNumberAndIfscCodeAndIsActiveTrue(UUID customerId, String accountNumber, String ifscCode);
}
