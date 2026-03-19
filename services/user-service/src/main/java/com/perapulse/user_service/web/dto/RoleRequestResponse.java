package com.perapulse.user_service.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.perapulse.user_service.domain.RoleRequestStatus;
import com.perapulse.user_service.domain.UserRole;

public record RoleRequestResponse(
		UUID id,
		String userSub,
		UserRole requestedRole,
		Integer graduationYear,
		String evidenceText,
		RoleRequestStatus status,
		String reviewedBySub,
		LocalDateTime createdAt,
		LocalDateTime updatedAt) {
}
