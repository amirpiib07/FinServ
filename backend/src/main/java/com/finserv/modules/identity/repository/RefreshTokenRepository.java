package com.finserv.modules.identity.repository;

import com.finserv.modules.identity.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    List<RefreshToken> findByUserIdAndRevokedFalse(UUID userId);
    List<RefreshToken> findByTokenFamilyId(UUID tokenFamilyId);
}
