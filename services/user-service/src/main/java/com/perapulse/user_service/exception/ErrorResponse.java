package com.perapulse.user_service.exception;

import java.time.OffsetDateTime;

public record ErrorResponse(
		OffsetDateTime timestamp,
		int status,
		String error,
		String message,
		String path) {
}
