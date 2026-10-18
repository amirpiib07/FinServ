package com.finserv.modules.deposit.repository;

import com.finserv.modules.deposit.entity.FixedDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FixedDepositRepository extends JpaRepository<FixedDeposit, UUID> {

    List<FixedDeposit> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    Optional<FixedDeposit> findByIdAndCustomerId(UUID id, UUID customerId);

    Optional<FixedDeposit> findByDepositNumber(String depositNumber);
}
