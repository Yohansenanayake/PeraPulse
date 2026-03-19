package com.perapulse.opportunities_service.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.perapulse.opportunities_service.domain.ApplicationStatus;

public record ApplicationResponse(
    UUID id,
    UUID opportunityId,
    String applicantSub,
    String coverLetter,
    String resumeUrl,
    ApplicationStatus status,
    LocalDateTime createdAt
) {}
