package com.finserv.modules.account.repository;

import com.finserv.modules.account.entity.GlChartOfAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GlChartOfAccountRepository extends JpaRepository<GlChartOfAccount, UUID> {
    Optional<GlChartOfAccount> findByGlCode(String glCode);
    boolean existsByGlCode(String glCode);
}
