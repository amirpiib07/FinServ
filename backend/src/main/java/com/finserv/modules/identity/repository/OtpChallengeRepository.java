package com.finserv.modules.identity.repository;

import com.finserv.modules.identity.entity.OtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {
    List<OtpChallenge> findByUserIdAndStatus(UUID userId, String status);
    Optional<OtpChallenge> findTopByUserIdAndContactTypeAndPurposeOrderByCreatedAtDesc(UUID userId, String contactType, String purpose);
    Optional<OtpChallenge> findTopByTargetDestinationAndPurposeOrderByCreatedAtDesc(String targetDestination, String purpose);
}
