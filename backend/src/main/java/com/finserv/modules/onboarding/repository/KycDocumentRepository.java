package com.finserv.modules.onboarding.repository;

import com.finserv.modules.onboarding.entity.KycDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, UUID> {
    List<KycDocument> findByCustomerId(UUID customerId);
    List<KycDocument> findByApplicationId(UUID applicationId);
    Optional<KycDocument> findByDocumentNumberHash(String documentNumberHash);
}
