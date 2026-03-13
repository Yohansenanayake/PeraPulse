package com.perapulse.user_service.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.perapulse.user_service.domain.RoleRequest;
import com.perapulse.user_service.domain.RoleRequestStatus;

public interface RoleRequestRepository extends JpaRepository<RoleRequest, UUID> {

	Optional<RoleRequest> findFirstByUserSubAndStatusOrderByCreatedAtDesc(String userSub, RoleRequestStatus status);

	List<RoleRequest> findAllByStatusOrderByCreatedAtDesc(RoleRequestStatus status);

	List<RoleRequest> findAllByOrderByCreatedAtDesc();
}
