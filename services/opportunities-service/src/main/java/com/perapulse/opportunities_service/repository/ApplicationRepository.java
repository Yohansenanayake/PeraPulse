package com.perapulse.opportunities_service.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.perapulse.opportunities_service.domain.Application;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    List<Application> findByOpportunityId(UUID opportunityId);

    List<Application> findByApplicantSub(String applicantSub);

    boolean existsByOpportunityIdAndApplicantSub(UUID opportunityId, String applicantSub);
}
