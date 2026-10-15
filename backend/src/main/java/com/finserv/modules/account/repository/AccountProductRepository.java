package com.finserv.modules.account.repository;

import com.finserv.modules.account.entity.AccountProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountProductRepository extends JpaRepository<AccountProduct, UUID> {
    Optional<AccountProduct> findByProductCode(String productCode);
    boolean existsByProductCode(String productCode);
}
