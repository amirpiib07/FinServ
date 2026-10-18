package com.finserv.modules.card.repository;

import com.finserv.modules.card.entity.VirtualCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VirtualCardRepository extends JpaRepository<VirtualCard, UUID> {

    Optional<VirtualCard> findByAccountId(UUID accountId);

    List<VirtualCard> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    Optional<VirtualCard> findByIdAndCustomerId(UUID id, UUID customerId);
}
