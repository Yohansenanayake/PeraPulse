package com.perapulse.opportunities_service.service;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perapulse.opportunities_service.config.JwtUserContext;
import com.perapulse.opportunities_service.domain.Application;
import com.perapulse.opportunities_service.domain.ApplicationStatus;
import com.perapulse.opportunities_service.domain.Opportunity;
import com.perapulse.opportunities_service.exception.ConflictException;
import com.perapulse.opportunities_service.exception.NotFoundException;
import com.perapulse.opportunities_service.repository.ApplicationRepository;
import com.perapulse.opportunities_service.web.dto.ApplicationResponse;
import com.perapulse.opportunities_service.web.dto.SubmitApplicationRequest;
import com.perapulse.opportunities_service.web.dto.UpdateApplicationStatusRequest;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final OpportunityService opportunityService;
    private final JwtUserContext jwtUserContext;
    private final com.perapulse.opportunities_service.messaging.OpportunityEventPublisher eventPublisher;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            OpportunityService opportunityService,
            JwtUserContext jwtUserContext,
            com.perapulse.opportunities_service.messaging.OpportunityEventPublisher eventPublisher) {
        this.applicationRepository = applicationRepository;
        this.opportunityService = opportunityService;
        this.jwtUserContext = jwtUserContext;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ApplicationResponse apply(UUID opportunityId, Jwt jwt, SubmitApplicationRequest request) {
        // Ensure opportunity exists
        opportunityService.findById(opportunityId);

        String applicantSub = jwtUserContext.subject(jwt);
        if (applicationRepository.existsByOpportunityIdAndApplicantSub(opportunityId, applicantSub)) {
            throw new ConflictException("You have already applied for this opportunity");
        }

        Application application = new Application();
        application.setOpportunityId(opportunityId);
        application.setApplicantSub(applicantSub);
        application.setCoverLetter(request.coverLetter());
        application.setResumeUrl(request.resumeUrl());
        application.setStatus(ApplicationStatus.PENDING);

        Application saved = applicationRepository.save(application);
        Opportunity opportunity = opportunityService.findById(opportunityId);
        eventPublisher.publishApplicationSubmitted(saved, opportunity.getCreatedBySub());
        return toApplicationResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsForListing(UUID opportunityId, Jwt jwt) {
        Opportunity opportunity = opportunityService.findById(opportunityId);
        checkListingOwnership(opportunity, jwt);

        return applicationRepository.findByOpportunityId(opportunityId).stream()
                .map(this::toApplicationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getMyApplications(Jwt jwt) {
        String sub = jwtUserContext.subject(jwt);
        return applicationRepository.findByApplicantSub(sub).stream()
                .map(this::toApplicationResponse)
                .toList();
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(UUID appId, Jwt jwt, UpdateApplicationStatusRequest request) {
        Application application = applicationRepository.findById(appId)
                .orElseThrow(() -> new NotFoundException("Application not found: " + appId));

        Opportunity opportunity = opportunityService.findById(application.getOpportunityId());
        checkListingOwnership(opportunity, jwt);

        application.setStatus(request.status());
        Application saved = applicationRepository.save(application);
        eventPublisher.publishApplicationStatusUpdated(saved);
        return toApplicationResponse(saved);
    }

    private void checkListingOwnership(Opportunity opportunity, Jwt jwt) {
        String sub = jwtUserContext.subject(jwt);
        boolean isAdmin = jwt.getClaimAsStringList("groups") != null && 
                          jwt.getClaimAsStringList("groups").contains("ADMIN");
        
        if (!isAdmin && jwt.getClaim("realm_access") instanceof java.util.Map<?, ?> access) {
            Object roles = access.get("roles");
            if (roles instanceof java.util.Collection<?> r) {
                isAdmin = r.contains("ADMIN");
            }
        }

        if (!opportunity.getCreatedBySub().equals(sub) && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to view/manage applications for this listing");
        }
    }

    private ApplicationResponse toApplicationResponse(Application a) {
        return new ApplicationResponse(
                a.getId(),
                a.getOpportunityId(),
                a.getApplicantSub(),
                a.getCoverLetter(),
                a.getResumeUrl(),
                a.getStatus(),
                a.getCreatedAt());
    }
}
