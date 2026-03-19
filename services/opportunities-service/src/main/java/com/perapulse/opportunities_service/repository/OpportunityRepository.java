package com.perapulse.opportunities_service.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.perapulse.opportunities_service.domain.Opportunity;
import com.perapulse.opportunities_service.domain.OpportunityStatus;
import com.perapulse.opportunities_service.domain.OpportunityType;

public interface OpportunityRepository extends JpaRepository<Opportunity, UUID> {

    Page<Opportunity> findByTypeAndStatus(OpportunityType type, OpportunityStatus status, Pageable pageable);

    Page<Opportunity> findByType(OpportunityType type, Pageable pageable);

    Page<Opportunity> findByStatus(OpportunityStatus status, Pageable pageable);
}
