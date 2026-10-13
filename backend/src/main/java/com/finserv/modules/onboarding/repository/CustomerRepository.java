package com.finserv.modules.onboarding.repository;

import com.finserv.modules.onboarding.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByUserId(UUID userId);
    Optional<Customer> findByCustomerNumber(String customerNumber);
    Optional<Customer> findByTaxIdentifierHash(String taxIdentifierHash);
    boolean existsByCustomerNumber(String customerNumber);
    boolean existsByTaxIdentifierHash(String taxIdentifierHash);
}
