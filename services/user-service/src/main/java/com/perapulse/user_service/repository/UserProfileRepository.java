package com.perapulse.user_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.perapulse.user_service.domain.UserProfile;
import com.perapulse.user_service.domain.UserRole;

public interface UserProfileRepository extends JpaRepository<UserProfile, java.util.UUID> {

	Optional<UserProfile> findByKeycloakSub(String keycloakSub);

	List<UserProfile> findAllByRoleOrderByCreatedAtDesc(UserRole role);

	List<UserProfile> findAllByOrderByCreatedAtDesc();
}
