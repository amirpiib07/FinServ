package com.finserv.modules.ledger.repository;

import com.finserv.modules.ledger.entity.GlLedgerPosting;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Insert-only repository for immutable gl_ledger_postings.
 * No delete methods are exposed.
 */
public interface GlLedgerPostingRepository extends Repository<GlLedgerPosting, UUID> {
    GlLedgerPosting save(GlLedgerPosting entity);
    <S extends GlLedgerPosting> Iterable<S> saveAll(Iterable<S> entities);
    Optional<GlLedgerPosting> findById(UUID id);
    List<GlLedgerPosting> findByJournalEntryId(UUID journalEntryId);
    List<GlLedgerPosting> findByCustomerAccountId(UUID customerAccountId);
    List<GlLedgerPosting> findAll();
    long count();
}
