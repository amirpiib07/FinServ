package com.finserv.modules.card.service;

import com.finserv.common.exception.ResourceNotFoundException;
import com.finserv.common.exception.ValidationException;
import com.finserv.common.util.UuidUtils;
import com.finserv.modules.account.entity.Account;
import com.finserv.modules.account.repository.AccountRepository;
import com.finserv.modules.audit.service.AuditService;
import com.finserv.modules.card.dto.UpdateCardControlsRequest;
import com.finserv.modules.card.dto.VirtualCardDto;
import com.finserv.modules.card.entity.VirtualCard;
import com.finserv.modules.card.repository.VirtualCardRepository;
import com.finserv.modules.identity.entity.User;
import com.finserv.modules.identity.repository.UserRepository;
import com.finserv.modules.onboarding.entity.Customer;
import com.finserv.modules.onboarding.service.CustomerLookupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class VirtualCardService {

    private static final Logger log = LoggerFactory.getLogger(VirtualCardService.class);

    private final VirtualCardRepository virtualCardRepository;
    private final AccountRepository accountRepository;
    private final CustomerLookupService customerLookupService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public VirtualCardService(VirtualCardRepository virtualCardRepository,
                              AccountRepository accountRepository,
                              CustomerLookupService customerLookupService,
                              UserRepository userRepository,
                              AuditService auditService) {
        this.virtualCardRepository = virtualCardRepository;
        this.accountRepository = accountRepository;
        this.customerLookupService = customerLookupService;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public List<VirtualCardDto> getCustomerCards(UUID userId) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);
        List<Account> accounts = accountRepository.findByCustomerId(customer.getId());

        String cardholderName = resolveCardholderName(userId, customer);
        LocalDate now = LocalDate.now();

        // Ensure every active account has a tokenized virtual debit card provisioned
        for (Account account : accounts) {
            if ("ACTIVE".equalsIgnoreCase(account.getStatus()) && virtualCardRepository.findByAccountId(account.getId()).isEmpty()) {
                String accNum = account.getAccountNumber();
                String last4 = accNum.length() >= 4 ? accNum.substring(accNum.length() - 4) : "1001";
                String masked = "4532 •••• •••• " + last4;

                VirtualCard card = new VirtualCard();
                card.setId(UuidUtils.generateV7());
                card.setAccountId(account.getId());
                card.setCustomerId(customer.getId());
                card.setCardNumberMasked(masked);
                card.setCardNumberLast4(last4);
                card.setCardNetwork("VISA");
                card.setCardType("PLATINUM_VIRTUAL_DEBIT");
                card.setCardholderName(cardholderName);
                card.setExpiryMonth(now.getMonthValue());
                card.setExpiryYear(now.getYear() + 5);
                card.setStatus("ACTIVE");
                card.setOnlineTransactionsEnabled(true);
                card.setContactlessEnabled(true);
                card.setInternationalEnabled(false);
                card.setDailySpendLimit(new BigDecimal("50000.00"));

                virtualCardRepository.save(card);
                log.info("Auto-provisioned virtual card ending {} for account {}", last4, accNum);
            }
        }

        return virtualCardRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public VirtualCardDto updateCardControls(UUID userId, UUID cardId, UpdateCardControlsRequest request) {
        Customer customer = customerLookupService.getOrCreateCustomerForUser(userId);

        VirtualCard card = virtualCardRepository.findByIdAndCustomerId(cardId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("VirtualCard", "id", cardId));

        if (request.status() != null && !request.status().isBlank()) {
            String newStatus = request.status().toUpperCase();
            if (!"ACTIVE".equals(newStatus) && !"FROZEN".equals(newStatus)) {
                throw new ValidationException("Card status can only be set to ACTIVE or FROZEN.");
            }
            card.setStatus(newStatus);
        }

        if (request.onlineTransactionsEnabled() != null) {
            card.setOnlineTransactionsEnabled(request.onlineTransactionsEnabled());
        }

        if (request.contactlessEnabled() != null) {
            card.setContactlessEnabled(request.contactlessEnabled());
        }

        if (request.internationalEnabled() != null) {
            card.setInternationalEnabled(request.internationalEnabled());
        }

        if (request.dailySpendLimit() != null) {
            if (request.dailySpendLimit().compareTo(BigDecimal.ZERO) < 0) {
                throw new ValidationException("Daily spend limit cannot be negative.");
            }
            card.setDailySpendLimit(request.dailySpendLimit());
        }

        VirtualCard updated = virtualCardRepository.save(card);

        auditService.logEvent(
                "UPDATE_CARD_CONTROLS",
                "VIRTUAL_CARD",
                updated.getId(),
                userId,
                "ROLE_CUSTOMER",
                "UPDATE",
                null,
                Map.of(
                        "status", updated.getStatus(),
                        "dailySpendLimit", updated.getDailySpendLimit().toString(),
                        "onlineTransactionsEnabled", String.valueOf(updated.isOnlineTransactionsEnabled()),
                        "contactlessEnabled", String.valueOf(updated.isContactlessEnabled()),
                        "internationalEnabled", String.valueOf(updated.isInternationalEnabled())
                )
        );
        return toDto(updated);
    }

    private String resolveCardholderName(UUID userId, Customer customer) {
        return userRepository.findById(userId)
                .map(User::getUsername)
                .map(u -> u.replace(".", " ").toUpperCase())
                .orElse("FINSERV PRIVILEGE MEMBER");
    }

    private VirtualCardDto toDto(VirtualCard card) {
        String accNum = accountRepository.findById(card.getAccountId())
                .map(Account::getAccountNumber)
                .orElse("FinServ Account");

        return new VirtualCardDto(
                card.getId(),
                card.getAccountId(),
                accNum,
                card.getCustomerId(),
                card.getCardNumberMasked(),
                card.getCardNumberLast4(),
                card.getCardNetwork(),
                card.getCardType(),
                card.getCardholderName(),
                card.getExpiryMonth(),
                card.getExpiryYear(),
                card.getStatus(),
                card.isOnlineTransactionsEnabled(),
                card.isContactlessEnabled(),
                card.isInternationalEnabled(),
                card.getDailySpendLimit()
        );
    }
}
