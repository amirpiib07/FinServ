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

    @org.springframework.data.jpa.repository.Query("""
        SELECT t FROM Transaction t
        WHERE (:accountId IS NULL OR t.fromAccountId = :accountId OR t.toAccountId = :accountId)
          AND (:accountIds IS NULL OR t.fromAccountId IN :accountIds OR t.toAccountId IN :accountIds)
          AND (:startDate IS NULL OR t.createdAt >= :startDate)
          AND (:endDate IS NULL OR t.createdAt <= :endDate)
          AND (:type IS NULL OR t.transactionType = :type)
          AND (:query IS NULL OR LOWER(t.transactionReference) LIKE LOWER(CONCAT('%', :query, '%')) OR (t.description IS NOT NULL AND LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%'))))
        ORDER BY t.createdAt DESC
    """)
    org.springframework.data.domain.Page<Transaction> findFilteredTransactions(
            @org.springframework.data.repository.query.Param("accountId") UUID accountId,
            @org.springframework.data.repository.query.Param("accountIds") List<UUID> accountIds,
            @org.springframework.data.repository.query.Param("startDate") java.time.Instant startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.Instant endDate,
            @org.springframework.data.repository.query.Param("type") String type,
            @org.springframework.data.repository.query.Param("query") String query,
            org.springframework.data.domain.Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query("""
        SELECT t FROM Transaction t
        WHERE (:accountId IS NULL OR t.fromAccountId = :accountId OR t.toAccountId = :accountId)
          AND (:accountIds IS NULL OR t.fromAccountId IN :accountIds OR t.toAccountId IN :accountIds)
          AND (:startDate IS NULL OR t.createdAt >= :startDate)
          AND (:endDate IS NULL OR t.createdAt <= :endDate)
          AND t.status = 'COMPLETED'
        ORDER BY t.createdAt DESC
    """)
    List<Transaction> findTransactionsForSummary(
            @org.springframework.data.repository.query.Param("accountId") UUID accountId,
            @org.springframework.data.repository.query.Param("accountIds") List<UUID> accountIds,
            @org.springframework.data.repository.query.Param("startDate") java.time.Instant startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.Instant endDate
    );
}
