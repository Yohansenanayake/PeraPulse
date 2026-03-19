package com.perapulse.opportunities_service.web;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perapulse.opportunities_service.service.ApplicationService;
import com.perapulse.opportunities_service.web.dto.ApplicationResponse;
import com.perapulse.opportunities_service.web.dto.UpdateApplicationStatusRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/applications")
@Validated
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public java.util.List<ApplicationResponse> getMyApplications(@AuthenticationPrincipal Jwt jwt) {
        return applicationService.getMyApplications(jwt);
    }

    @PutMapping("/{appId}/status")
    @PreAuthorize("isAuthenticated()")
    public ApplicationResponse updateApplicationStatus(
            @PathVariable("appId") UUID appId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateApplicationStatusRequest request) {
        return applicationService.updateApplicationStatus(appId, jwt, request);
    }
}
