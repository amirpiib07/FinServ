package com.finserv.modules.account.repository;

import com.finserv.modules.account.entity.AccountHold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountHoldRepository extends JpaRepository<AccountHold, UUID> {
    Optional<AccountHold> findByHoldReference(String holdReference);
    List<AccountHold> findByAccountIdAndStatus(UUID accountId, String status);
}
