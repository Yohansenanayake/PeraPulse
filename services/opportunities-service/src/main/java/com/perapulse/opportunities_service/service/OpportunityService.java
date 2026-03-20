package com.perapulse.opportunities_service.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perapulse.opportunities_service.config.JwtUserContext;
import com.perapulse.opportunities_service.domain.Opportunity;
import com.perapulse.opportunities_service.domain.OpportunityStatus;
import com.perapulse.opportunities_service.domain.OpportunityType;
import com.perapulse.opportunities_service.exception.NotFoundException;
import com.perapulse.opportunities_service.repository.OpportunityRepository;
import com.perapulse.opportunities_service.web.dto.CreateOpportunityRequest;
import com.perapulse.opportunities_service.web.dto.OpportunityResponse;
import com.perapulse.opportunities_service.web.dto.UpdateOpportunityRequest;

@Service
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final JwtUserContext jwtUserContext;
    private final com.perapulse.opportunities_service.messaging.OpportunityEventPublisher eventPublisher;

    public OpportunityService(
            OpportunityRepository opportunityRepository, 
            JwtUserContext jwtUserContext,
            com.perapulse.opportunities_service.messaging.OpportunityEventPublisher eventPublisher) {
        this.opportunityRepository = opportunityRepository;
        this.jwtUserContext = jwtUserContext;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public OpportunityResponse createOpportunity(Jwt jwt, CreateOpportunityRequest request) {
        Opportunity opportunity = new Opportunity();
        opportunity.setCreatedBySub(jwtUserContext.subject(jwt));
        opportunity.setType(request.type());
        opportunity.setTitle(request.title());
        opportunity.setCompany(request.company());
        opportunity.setDescription(request.description());
        opportunity.setLocation(request.location());
        opportunity.setDeadline(request.deadline());
        opportunity.setStatus(OpportunityStatus.OPEN);

        Opportunity saved = opportunityRepository.save(opportunity);
        eventPublisher.publishOpportunityPosted(saved);
        return toOpportunityResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<OpportunityResponse> listOpportunities(String type, String status, Pageable pageable) {
        OpportunityType optType = parseType(type);
        OpportunityStatus optStatus = parseStatus(status);

        Page<Opportunity> page;
        if (optType != null && optStatus != null) {
            page = opportunityRepository.findByTypeAndStatus(optType, optStatus, pageable);
        } else if (optType != null) {
            page = opportunityRepository.findByType(optType, pageable);
        } else if (optStatus != null) {
            page = opportunityRepository.findByStatus(optStatus, pageable);
        } else {
            page = opportunityRepository.findAll(pageable);
        }

        return page.map(this::toOpportunityResponse);
    }

    @Transactional(readOnly = true)
    public OpportunityResponse getOpportunity(UUID id) {
        return toOpportunityResponse(findById(id));
    }

    @Transactional
    public OpportunityResponse updateOpportunity(UUID id, Jwt jwt, UpdateOpportunityRequest request) {
        Opportunity opportunity = findById(id);
        checkOwnership(opportunity, jwt);

        opportunity.setTitle(request.title());
        opportunity.setCompany(request.company());
        opportunity.setDescription(request.description());
        opportunity.setLocation(request.location());
        opportunity.setDeadline(request.deadline());
        opportunity.setStatus(request.status());

        return toOpportunityResponse(opportunityRepository.save(opportunity));
    }

    @Transactional
    public void deleteOpportunity(UUID id, Jwt jwt) {
        Opportunity opportunity = findById(id);
        checkOwnership(opportunity, jwt);
        opportunityRepository.delete(opportunity);
    }

    public Opportunity findById(UUID id) {
        return opportunityRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Opportunity not found: " + id));
    }

    private void checkOwnership(Opportunity opportunity, Jwt jwt) {
        String sub = jwtUserContext.subject(jwt);
        boolean isAdmin = jwt.getClaimAsStringList("groups") != null && 
                          jwt.getClaimAsStringList("groups").contains("ADMIN");
        
        // Fallback for realm_access roles if groups is missing
        if (!isAdmin && jwt.getClaim("realm_access") instanceof java.util.Map<?, ?> access) {
            Object roles = access.get("roles");
            if (roles instanceof java.util.Collection<?> r) {
                isAdmin = r.contains("ADMIN");
            }
        }

        if (!opportunity.getCreatedBySub().equals(sub) && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to modify this opportunity");
        }
    }

    private OpportunityType parseType(String type) {
        if (type == null || type.isBlank()) return null;
        try { return OpportunityType.valueOf(type.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }

    private OpportunityStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try { return OpportunityStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }

    private OpportunityResponse toOpportunityResponse(Opportunity o) {
        return new OpportunityResponse(
                o.getId(),
                o.getCreatedBySub(),
                o.getType(),
                o.getTitle(),
                o.getCompany(),
                o.getDescription(),
                o.getLocation(),
                o.getDeadline(),
                o.getStatus(),
                o.getCreatedAt());
    }
}
