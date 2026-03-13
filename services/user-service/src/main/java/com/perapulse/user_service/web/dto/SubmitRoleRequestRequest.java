package com.perapulse.user_service.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record SubmitRoleRequestRequest(
		@Min(1950) @Max(2100) Integer graduationYear,
		@Size(max = 2000) String evidenceText) {
}
