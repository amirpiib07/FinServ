package com.finserv.modules.account.repository;

import com.finserv.modules.account.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByAccountNumber(String accountNumber);

    List<Account> findByCustomerId(UUID customerId);

    boolean existsByAccountNumber(String accountNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdWithLock(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.accountNumber = :accountNumber")
    Optional<Account> findByAccountNumberWithLock(@Param("accountNumber") String accountNumber);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(a.currentBalance), 0) FROM Account a WHERE a.status = 'ACTIVE'")
    java.math.BigDecimal sumActiveCurrentBalances();

    @Query("""
        SELECT a FROM Account a
        WHERE (:status IS NULL OR a.status = :status)
          AND (:search IS NULL OR LOWER(a.accountNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR (a.nickname IS NOT NULL AND LOWER(a.nickname) LIKE LOWER(CONCAT('%', :search, '%'))))
        ORDER BY a.openedAt DESC
    """)
    org.springframework.data.domain.Page<Account> findAdminFilteredAccounts(
            @Param("status") String status,
            @Param("search") String search,
            org.springframework.data.domain.Pageable pageable
    );
}
