package com.perapulse.opportunities_service.web.dto;

import com.perapulse.opportunities_service.domain.ApplicationStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateApplicationStatusRequest(
    @NotNull ApplicationStatus status
) {}
