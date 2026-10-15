package com.finserv.modules.onboarding.repository;

import com.finserv.modules.onboarding.entity.CustomerDeclaration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerDeclarationRepository extends JpaRepository<CustomerDeclaration, UUID> {
    List<CustomerDeclaration> findByCustomerId(UUID customerId);
    List<CustomerDeclaration> findByApplicationId(UUID applicationId);
}
