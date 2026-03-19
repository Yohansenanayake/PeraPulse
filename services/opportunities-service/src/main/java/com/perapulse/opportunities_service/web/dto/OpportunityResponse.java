package com.perapulse.opportunities_service.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.perapulse.opportunities_service.domain.OpportunityStatus;
import com.perapulse.opportunities_service.domain.OpportunityType;

public record OpportunityResponse(
    UUID id,
    String createdBySub,
    OpportunityType type,
    String title,
    String company,
    String description,
    String location,
    LocalDate deadline,
    OpportunityStatus status,
    LocalDateTime createdAt
) {}
