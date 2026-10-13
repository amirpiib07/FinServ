package com.finserv.modules.transaction.repository;

import com.finserv.modules.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByTransactionReference(String transactionReference);
    List<Transaction> findByFromAccountId(UUID fromAccountId);
    List<Transaction> findByToAccountId(UUID toAccountId);
    boolean existsByTransactionReference(String transactionReference);
}
