package com.perapulse.user_service.web.dto;

import java.time.LocalDateTime;

import com.perapulse.user_service.domain.UserRole;

public record UserProfileResponse(
		String keycloakSub,
		UserRole role,
		String displayName,
		String email,
		String department,
		Integer gradYear,
		String bio,
		String linkedinUrl,
		String avatarUrl,
		LocalDateTime createdAt,
		LocalDateTime updatedAt) {
}
