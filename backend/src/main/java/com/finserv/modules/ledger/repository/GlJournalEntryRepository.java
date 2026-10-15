package com.finserv.modules.ledger.repository;

import com.finserv.modules.ledger.entity.GlJournalEntry;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Insert-only repository for immutable gl_journal_entries.
 * No delete methods are exposed.
 */
public interface GlJournalEntryRepository extends Repository<GlJournalEntry, UUID> {
    GlJournalEntry save(GlJournalEntry entity);
    <S extends GlJournalEntry> Iterable<S> saveAll(Iterable<S> entities);
    Optional<GlJournalEntry> findById(UUID id);
    Optional<GlJournalEntry> findByJournalReference(String journalReference);
    List<GlJournalEntry> findAll();
    long count();
}
