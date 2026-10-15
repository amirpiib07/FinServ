package com.finserv.modules.identity.service;

import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.exception.ValidationException;
import com.finserv.modules.identity.dto.SendOtpRequest;
import com.finserv.modules.identity.dto.SendOtpResponse;
import com.finserv.modules.identity.dto.VerifyOtpRequest;
import com.finserv.modules.identity.dto.VerifyOtpResponse;
import com.finserv.modules.identity.entity.OtpChallenge;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.repository.OtpChallengeRepository;
import com.finserv.modules.identity.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final OtpChallengeRepository otpChallengeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    public OtpService(OtpChallengeRepository otpChallengeRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      Environment environment) {
        this.otpChallengeRepository = otpChallengeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Transactional
    public SendOtpResponse sendOtp(UUID currentUserId, SendOtpRequest req) {
        String type = req.getContactType().toUpperCase().trim();
        if (!type.equals("EMAIL") && !type.equals("PHONE")) {
            throw new ValidationException("Contact type must be EMAIL or PHONE");
        }

        UUID targetUserId = currentUserId;
        if (targetUserId == null) {
            // Check if user exists by destination
            if (type.equals("EMAIL")) {
                targetUserId = userRepository.findByEmail(req.getTargetDestination())
                        .map(User::getId)
                        .orElse(SYSTEM_USER_ID);
            } else {
                targetUserId = userRepository.findByPhoneNumber(req.getTargetDestination())
                        .map(User::getId)
                        .orElse(SYSTEM_USER_ID);
            }
        }

        // Generate 6-digit numeric OTP
        String otpCode = String.format("%06d", RANDOM.nextInt(1_000_000));
        String otpHash = passwordEncoder.encode(otpCode);

        OtpChallenge challenge = new OtpChallenge();
        challenge.setUserId(targetUserId);
        challenge.setContactType(type);
        challenge.setTargetDestination(req.getTargetDestination().trim());
        challenge.setPurpose(req.getPurpose() != null ? req.getPurpose().toUpperCase().trim() : "REGISTRATION");
        challenge.setOtpHash(otpHash);
        challenge.setAttempts(0);
        challenge.setMaxAttempts(3);
        challenge.setStatus("PENDING");
        challenge.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));

        challenge = otpChallengeRepository.save(challenge);

        String masked = maskDestination(type, req.getTargetDestination());
        boolean isDevOrTest = isDevOrTestProfile();

        if (isDevOrTest) {
            log.info("[SIMULATED OTP] Purpose: {}, Type: {}, Destination: {}, Code: {}",
                    challenge.getPurpose(), type, masked, otpCode);
        }

        return new SendOtpResponse(
                challenge.getId(),
                type,
                req.getTargetDestination(),
                masked,
                600L,
                isDevOrTest ? otpCode : null
        );
    }

    @Transactional
    public VerifyOtpResponse verifyOtp(UUID currentUserId, VerifyOtpRequest req) {
        OtpChallenge challenge = otpChallengeRepository.findById(req.getChallengeId())
                .orElseThrow(() -> new ResourceNotFoundException("OTP challenge not found"));

        if (!"PENDING".equalsIgnoreCase(challenge.getStatus())) {
            throw new ValidationException("OTP challenge is no longer pending (" + challenge.getStatus() + ")");
        }

        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            challenge.setStatus("EXPIRED");
            otpChallengeRepository.save(challenge);
            throw new ValidationException("OTP has expired. Please request a new one.");
        }

        if (challenge.getAttempts() >= challenge.getMaxAttempts()) {
            challenge.setStatus("FAILED");
            otpChallengeRepository.save(challenge);
            throw new ValidationException("Maximum verification attempts exceeded. Please request a new OTP.");
        }

        challenge.setAttempts(challenge.getAttempts() + 1);

        if (!passwordEncoder.matches(req.getOtpCode().trim(), challenge.getOtpHash())) {
            if (challenge.getAttempts() >= challenge.getMaxAttempts()) {
                challenge.setStatus("FAILED");
            }
            otpChallengeRepository.save(challenge);
            throw new ValidationException("Invalid OTP code. " + (challenge.getMaxAttempts() - challenge.getAttempts()) + " attempt(s) remaining.");
        }

        // Successfully verified
        challenge.setStatus("VERIFIED");
        challenge.setVerifiedAt(Instant.now());
        otpChallengeRepository.save(challenge);

        // Update user contact verification timestamp if applicable
        UUID userIdToUpdate = currentUserId != null ? currentUserId : challenge.getUserId();
        if (userIdToUpdate != null && !userIdToUpdate.equals(SYSTEM_USER_ID)) {
            userRepository.findById(userIdToUpdate).ifPresent(user -> {
                if ("EMAIL".equalsIgnoreCase(challenge.getContactType())) {
                    user.setEmailVerifiedAt(Instant.now());
                } else if ("PHONE".equalsIgnoreCase(challenge.getContactType())) {
                    user.setPhoneVerifiedAt(Instant.now());
                }
                userRepository.save(user);
            });
        }

        return new VerifyOtpResponse(true, "Contact verified successfully");
    }

    private String maskDestination(String type, String destination) {
        if (destination == null || destination.isBlank()) return "***";
        if ("EMAIL".equalsIgnoreCase(type) && destination.contains("@")) {
            String[] parts = destination.split("@", 2);
            String local = parts[0];
            String domain = parts[1];
            if (local.length() <= 2) {
                return local.charAt(0) + "***@" + domain;
            }
            return local.charAt(0) + "***" + local.charAt(local.length() - 1) + "@" + domain;
        }
        // Phone
        if (destination.length() <= 4) return "****";
        return destination.substring(0, Math.min(3, destination.length() - 4))
                + "******" + destination.substring(destination.length() - 4);
    }

    private boolean isDevOrTestProfile() {
        List<String> activeProfiles = Arrays.asList(environment.getActiveProfiles());
        return activeProfiles.contains("dev") || activeProfiles.contains("test") || activeProfiles.isEmpty();
    }
}
