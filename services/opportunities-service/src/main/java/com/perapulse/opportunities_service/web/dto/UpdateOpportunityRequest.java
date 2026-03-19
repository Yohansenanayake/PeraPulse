package com.perapulse.opportunities_service.web.dto;

import java.time.LocalDate;

import com.perapulse.opportunities_service.domain.OpportunityStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateOpportunityRequest(
    @NotBlank @Size(max = 500) String title,
    @NotBlank @Size(max = 255) String company,
    String description,
    @Size(max = 255) String location,
    LocalDate deadline,
    @NotNull OpportunityStatus status
) {}
