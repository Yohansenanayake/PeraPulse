package com.perapulse.opportunities_service.web;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perapulse.opportunities_service.service.ApplicationService;
import com.perapulse.opportunities_service.service.OpportunityService;
import com.perapulse.opportunities_service.web.dto.ApplicationResponse;
import com.perapulse.opportunities_service.web.dto.CreateOpportunityRequest;
import com.perapulse.opportunities_service.web.dto.OpportunityResponse;
import com.perapulse.opportunities_service.web.dto.SubmitApplicationRequest;
import com.perapulse.opportunities_service.web.dto.UpdateOpportunityRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/opportunities")
@Validated
public class OpportunityController {

    private final OpportunityService opportunityService;
    private final ApplicationService applicationService;

    public OpportunityController(OpportunityService opportunityService, ApplicationService applicationService) {
        this.opportunityService = opportunityService;
        this.applicationService = applicationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ALUMNI', 'ADMIN')")
    public OpportunityResponse createOpportunity(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateOpportunityRequest request) {
        return opportunityService.createOpportunity(jwt, request);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Page<OpportunityResponse> listOpportunities(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return opportunityService.listOpportunities(type, status, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public OpportunityResponse getOpportunity(@PathVariable("id") UUID id) {
        return opportunityService.getOpportunity(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public OpportunityResponse updateOpportunity(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateOpportunityRequest request) {
        return opportunityService.updateOpportunity(id, jwt, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public void deleteOpportunity(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        opportunityService.deleteOpportunity(id, jwt);
    }

    @PostMapping("/{id}/apply")
    @PreAuthorize("hasRole('STUDENT')")
    public ApplicationResponse apply(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SubmitApplicationRequest request) {
        return applicationService.apply(id, jwt, request);
    }

    @GetMapping("/{id}/applications")
    @PreAuthorize("isAuthenticated()")
    public java.util.List<ApplicationResponse> getApplicationsForListing(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        return applicationService.getApplicationsForListing(id, jwt);
    }
}
