package com.finserv.modules.organization.repository;

import com.finserv.modules.organization.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {
    Optional<Branch> findByBranchCode(String branchCode);
    Optional<Branch> findByIfscCode(String ifscCode);
    List<Branch> findByStatus(String status);
    boolean existsByBranchCode(String branchCode);
}
