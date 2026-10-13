package com.finserv.modules.account.repository;

import com.finserv.modules.account.entity.AccountApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountApplicationRepository extends JpaRepository<AccountApplication, UUID> {
    Optional<AccountApplication> findByApplicationNumber(String applicationNumber);
    List<AccountApplication> findByCustomerId(UUID customerId);
}
