package com.perapulse.user_service.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateMyProfileRequest(
		@Size(max = 255) String displayName,
		@Size(max = 255) String department,
		@Min(1950) @Max(2100) Integer gradYear,
		@Size(max = 2000) String bio,
		@Size(max = 500) String linkedinUrl,
		@Size(max = 500) String avatarUrl) {
}
