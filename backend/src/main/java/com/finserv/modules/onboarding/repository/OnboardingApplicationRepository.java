package com.finserv.modules.onboarding.repository;

import com.finserv.modules.onboarding.entity.OnboardingApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OnboardingApplicationRepository extends JpaRepository<OnboardingApplication, UUID> {
    Optional<OnboardingApplication> findByApplicationReference(String applicationReference);
    Optional<OnboardingApplication> findByUserIdAndStatusIn(UUID userId, java.util.Collection<String> statuses);
    boolean existsByApplicationReference(String applicationReference);
}
