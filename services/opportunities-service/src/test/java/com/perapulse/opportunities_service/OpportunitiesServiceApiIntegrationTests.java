package com.perapulse.opportunities_service;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perapulse.opportunities_service.domain.Opportunity;
import com.perapulse.opportunities_service.domain.OpportunityStatus;
import com.perapulse.opportunities_service.domain.OpportunityType;
import com.perapulse.opportunities_service.messaging.OpportunityEventPublisher;
import com.perapulse.opportunities_service.repository.ApplicationRepository;
import com.perapulse.opportunities_service.repository.OpportunityRepository;

@SpringBootTest
@ActiveProfiles("test")
class OpportunitiesServiceApiIntegrationTests {

    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @MockitoBean
    private OpportunityEventPublisher eventPublisher;

    @BeforeEach
    void setUp() {
        applicationRepository.deleteAll();
        opportunityRepository.deleteAll();
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    void alumniCanCreateListing() throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
                "type", "JOB",
                "title", "Software Engineer",
                "company", "PeraPulse Corp",
                "description", "Great entry level role",
                "location", "Remote"
        ));

        mockMvc.perform(post("/api/opportunities")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ALUMNI")).jwt(jwt -> jwt
                        .subject("alumni-sub-1")
                        .claim("realm_access", Map.of("roles", List.of("ALUMNI")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Software Engineer")))
                .andExpect(jsonPath("$.createdBySub", is("alumni-sub-1")))
                .andExpect(jsonPath("$.status", is("OPEN")));
    }

    @Test
    void studentCannotCreateListing() throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of("type", "JOB", "title", "Test", "company", "Test"));

        mockMvc.perform(post("/api/opportunities")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")).jwt(jwt -> jwt
                        .subject("student-sub-1")
                        .claim("realm_access", Map.of("roles", List.of("STUDENT")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    void anyAuthUserCanListOpportunities() throws Exception {
        saveOpportunity("alumni-1", "Job 1", OpportunityType.JOB);
        saveOpportunity("alumni-2", "Internship 1", OpportunityType.INTERNSHIP);

        mockMvc.perform(get("/api/opportunities")
                .with(jwt().jwt(jwt -> jwt.subject("any-user"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    void studentCanApply() throws Exception {
        Opportunity opp = saveOpportunity("alumni-1", "Job 1", OpportunityType.JOB);
        String payload = objectMapper.writeValueAsString(Map.of("coverLetter", "Hire me"));

        mockMvc.perform(post("/api/opportunities/{id}/apply", opp.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")).jwt(jwt -> jwt
                        .subject("student-1")
                        .claim("realm_access", Map.of("roles", List.of("STUDENT")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicantSub", is("student-1")))
                .andExpect(jsonPath("$.status", is("PENDING")));
    }

    @Test
    void studentCannotApplyTwice() throws Exception {
        Opportunity opp = saveOpportunity("alumni-1", "Job 1", OpportunityType.JOB);
        String payload = objectMapper.writeValueAsString(Map.of("coverLetter", "Hire me"));

        // First application
        mockMvc.perform(post("/api/opportunities/{id}/apply", opp.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")).jwt(jwt -> jwt
                        .subject("student-1")
                        .claim("realm_access", Map.of("roles", List.of("STUDENT")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk());

        // Second application
        mockMvc.perform(post("/api/opportunities/{id}/apply", opp.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")).jwt(jwt -> jwt
                        .subject("student-1")
                        .claim("realm_access", Map.of("roles", List.of("STUDENT")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isConflict());
    }

    @Test
    void ownerCanViewApplications() throws Exception {
        Opportunity opp = saveOpportunity("alumni-1", "Job 1", OpportunityType.JOB);
        apply(opp.getId(), "student-1");

        mockMvc.perform(get("/api/opportunities/{id}/applications", opp.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ALUMNI")).jwt(jwt -> jwt
                        .subject("alumni-1")
                        .claim("realm_access", Map.of("roles", List.of("ALUMNI"))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void nonOwnerCannotViewApplications() throws Exception {
        Opportunity opp = saveOpportunity("alumni-1", "Job 1", OpportunityType.JOB);

        mockMvc.perform(get("/api/opportunities/{id}/applications", opp.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")).jwt(jwt -> jwt
                        .subject("student-1")
                        .claim("realm_access", Map.of("roles", List.of("STUDENT"))))))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerCanUpdateApplicationStatus() throws Exception {
        Opportunity opp = saveOpportunity("alumni-1", "Job 1", OpportunityType.JOB);
        apply(opp.getId(), "student-1");
        UUID appId = applicationRepository.findByOpportunityId(opp.getId()).get(0).getId();

        String payload = objectMapper.writeValueAsString(Map.of("status", "ACCEPTED"));

        mockMvc.perform(put("/api/applications/{appId}/status", appId)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ALUMNI")).jwt(jwt -> jwt
                        .subject("alumni-1")
                        .claim("realm_access", Map.of("roles", List.of("ALUMNI")))))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACCEPTED")));
    }

    @Test
    void adminCanDeleteAnyOpportunity() throws Exception {
        Opportunity opp = saveOpportunity("alumni-1", "Job 1", OpportunityType.JOB);

        mockMvc.perform(delete("/api/opportunities/{id}", opp.getId())
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")).jwt(jwt -> jwt
                        .subject("admin-sub")
                        .claim("realm_access", Map.of("roles", List.of("ADMIN"))))))
                .andExpect(status().isOk());

        assert !opportunityRepository.existsById(opp.getId());
    }

    private Opportunity saveOpportunity(String creator, String title, OpportunityType type) {
        Opportunity opp = new Opportunity();
        opp.setCreatedBySub(creator);
        opp.setTitle(title);
        opp.setCompany("Test Corp");
        opp.setType(type);
        opp.setStatus(OpportunityStatus.OPEN);
        return opportunityRepository.save(opp);
    }

    private void apply(UUID oppId, String applicant) {
        com.perapulse.opportunities_service.domain.Application app = new com.perapulse.opportunities_service.domain.Application();
        app.setOpportunityId(oppId);
        app.setApplicantSub(applicant);
        app.setStatus(com.perapulse.opportunities_service.domain.ApplicationStatus.PENDING);
        applicationRepository.save(app);
    }
}
