package com.finserv.modules.identity.repository;

import com.finserv.modules.identity.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UserRole.UserRoleId> {
    List<UserRole> findByUserId(UUID userId);
    boolean existsByUserIdAndRoleId(UUID userId, Integer roleId);
}
