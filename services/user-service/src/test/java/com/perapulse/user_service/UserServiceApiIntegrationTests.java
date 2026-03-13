package com.perapulse.user_service;

import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
class UserServiceApiIntegrationTests {

	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Autowired
	private WebApplicationContext webApplicationContext;

	@BeforeEach
	void setUp() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
				.apply(springSecurity())
				.build();
	}

	@Test
	void publicInfoIsAccessibleWithoutToken() throws Exception {
		mockMvc.perform(get("/api/users/public-info"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.service").exists());
	}

	@Test
	void getMyProfileAutoCreatesProfileFromJwt() throws Exception {
		mockMvc.perform(get("/api/profiles/me")
				.with(jwt().jwt(jwt -> jwt
						.subject("user-sub-1")
						.claim("email", "student1@eng.pdn.ac.lk")
						.claim("preferred_username", "student1")
						.claim("realm_access", Map.of("roles", List.of("STUDENT"))))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.keycloakSub", is("user-sub-1")))
				.andExpect(jsonPath("$.role", is("STUDENT")))
				.andExpect(jsonPath("$.email", is("student1@eng.pdn.ac.lk")));
	}

	@Test
	void studentCanSubmitRoleRequest() throws Exception {
		String payload = objectMapper.writeValueAsString(Map.of(
				"graduationYear", 2026,
				"evidenceText", "Final transcript ready"));

		mockMvc.perform(post("/api/profiles/role-requests")
				.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")).jwt(jwt -> jwt
						.subject("student-sub")
						.claim("realm_access", Map.of("roles", List.of("STUDENT")))))
				.contentType(MediaType.APPLICATION_JSON)
				.content(payload))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.userSub", is("student-sub")))
				.andExpect(jsonPath("$.requestedRole", is("ALUMNI")))
				.andExpect(jsonPath("$.status", is("PENDING")));
	}

	@Test
	void studentCannotAccessAdminEndpoints() throws Exception {
		mockMvc.perform(get("/api/admin/users")
				.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")).jwt(jwt -> jwt
						.subject("student-sub")
						.claim("realm_access", Map.of("roles", List.of("STUDENT"))))))
				.andExpect(status().isForbidden());
	}

	@Test
	void adminCanApprovePendingRoleRequest() throws Exception {
		String payload = objectMapper.writeValueAsString(Map.of(
				"graduationYear", 2025,
				"evidenceText", "Completed degree"));

		String body = mockMvc.perform(post("/api/profiles/role-requests")
				.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT")).jwt(jwt -> jwt
						.subject("student-sub-2")
						.claim("realm_access", Map.of("roles", List.of("STUDENT")))))
				.contentType(MediaType.APPLICATION_JSON)
				.content(payload))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		String requestId = objectMapper.readTree(body).get("id").asText();

		mockMvc.perform(put("/api/admin/role-requests/{id}/approve", requestId)
				.with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")).jwt(jwt -> jwt
						.subject("admin-sub")
						.claim("realm_access", Map.of("roles", List.of("ADMIN"))))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("APPROVED")))
				.andExpect(jsonPath("$.reviewedBySub", is("admin-sub")));
	}
}
