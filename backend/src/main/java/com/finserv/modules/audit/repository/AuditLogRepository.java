package com.finserv.modules.audit.repository;

import com.finserv.modules.audit.entity.AuditLog;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Insert-only repository for immutable audit_logs.
 * No delete methods are exposed.
 */
public interface AuditLogRepository extends Repository<AuditLog, UUID> {
    AuditLog save(AuditLog entity);
    <S extends AuditLog> Iterable<S> saveAll(Iterable<S> entities);
    Optional<AuditLog> findById(UUID id);
    Optional<AuditLog> findByChainSeq(Long chainSeq);
    List<AuditLog> findAllByOrderByChainSeqAsc();
    List<AuditLog> findByEntityTypeAndEntityIdOrderByChainSeqAsc(String entityType, String entityId);
    long count();

    @org.springframework.data.jpa.repository.Query("""
        SELECT a FROM AuditLog a
        WHERE (:action IS NULL OR a.action = :action)
          AND (:entityType IS NULL OR a.entityType = :entityType)
          AND (:actorUserId IS NULL OR a.actorUserId = :actorUserId)
        ORDER BY a.chainSeq DESC
    """)
    org.springframework.data.domain.Page<AuditLog> findFilteredAuditLogs(
            @org.springframework.data.repository.query.Param("action") String action,
            @org.springframework.data.repository.query.Param("entityType") String entityType,
            @org.springframework.data.repository.query.Param("actorUserId") UUID actorUserId,
            org.springframework.data.domain.Pageable pageable
    );
}
