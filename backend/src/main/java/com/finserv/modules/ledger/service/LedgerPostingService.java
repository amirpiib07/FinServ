package com.finserv.modules.ledger.service;

import com.finserv.common.util.UuidUtils;
import com.finserv.modules.ledger.entity.GlJournalEntry;
import com.finserv.modules.ledger.entity.GlLedgerPosting;
import com.finserv.modules.ledger.repository.GlJournalEntryRepository;
import com.finserv.modules.ledger.repository.GlLedgerPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Core General Ledger Posting Engine.
 * Enforces strict double-entry invariants: every entry MUST have SUM(DEBIT) == SUM(CREDIT).
 * All postings and journal entries are physically immutable once written.
 */
@Service
public class LedgerPostingService {

    private static final Logger log = LoggerFactory.getLogger(LedgerPostingService.class);

    private final GlJournalEntryRepository glJournalEntryRepository;
    private final GlLedgerPostingRepository glLedgerPostingRepository;

    public LedgerPostingService(GlJournalEntryRepository glJournalEntryRepository,
                                GlLedgerPostingRepository glLedgerPostingRepository) {
        this.glJournalEntryRepository = glJournalEntryRepository;
        this.glLedgerPostingRepository = glLedgerPostingRepository;
    }

    /**
     * Records a balanced double-entry GL voucher and its underlying postings.
     *
     * @param transactionType the type of transaction (e.g. DEPOSIT, WITHDRAWAL, TRANSFER_INTERNAL, TRANSFER_EXTERNAL)
     * @param description     narration for the journal entry
     * @param actorUserId     user ID who initiated or authorized this action
     * @param instructions    list of debit and credit posting legs
     * @return the saved immutable GlJournalEntry header
     */
    @Transactional
    public GlJournalEntry recordJournalEntry(String transactionType,
                                             String description,
                                             UUID actorUserId,
                                             List<PostingInstruction> instructions) {
        if (instructions == null || instructions.isEmpty()) {
            throw new IllegalArgumentException("Ledger posting instructions cannot be empty");
        }

        BigDecimal totalDebits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalCredits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        for (PostingInstruction instruction : instructions) {
            BigDecimal amt = instruction.amount().setScale(2, RoundingMode.HALF_UP);
            if ("DEBIT".equalsIgnoreCase(instruction.entryType())) {
                totalDebits = totalDebits.add(amt);
            } else if ("CREDIT".equalsIgnoreCase(instruction.entryType())) {
                totalCredits = totalCredits.add(amt);
            }
        }

        // Strict double-entry invariant verification
        if (totalDebits.compareTo(totalCredits) != 0) {
            String err = String.format("Unbalanced General Ledger Entry: Total Debits (INR %s) != Total Credits (INR %s)",
                    totalDebits, totalCredits);
            log.error(err);
            throw new IllegalStateException(err);
        }

        // Generate unique journal reference
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String randomSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        String journalRef = "JNL-" + datePart + "-" + randomSuffix;

        UUID journalId = UuidUtils.generateV7();
        GlJournalEntry journalEntry = new GlJournalEntry(
                journalId,
                journalRef,
                transactionType,
                LocalDate.now(),
                description != null ? description : "Financial transaction posting",
                null,
                actorUserId
        );

        journalEntry = glJournalEntryRepository.save(journalEntry);

        for (PostingInstruction inst : instructions) {
            GlLedgerPosting posting = new GlLedgerPosting(
                    UuidUtils.generateV7(),
                    journalEntry.getId(),
                    inst.glAccountId(),
                    inst.customerAccountId(),
                    inst.entryType(),
                    inst.amount().setScale(2, RoundingMode.HALF_UP)
            );
            glLedgerPostingRepository.save(posting);
        }

        log.debug("Successfully posted balanced GL journal {} ({}) with {} legs. Debits={}, Credits={}",
                journalRef, transactionType, instructions.size(), totalDebits, totalCredits);

        return journalEntry;
    }
}
