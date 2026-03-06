package com.perapulse.user_service.web;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserInfoController {

	private final String applicationName;
	private final String supportEmail;

	public UserInfoController(
			@Value("${info.app.name:PeraPulse User Service}") String applicationName,
			@Value("${info.app.support-email:contact@perapulse.local}") String supportEmail) {
		this.applicationName = applicationName;
		this.supportEmail = supportEmail;
	}

	@GetMapping("/public-info")
	public Map<String, Object> publicInfo() {
		return Map.of(
				"service", applicationName,
				"contactEmail", supportEmail,
				"message", "Public test endpoint is reachable through the gateway.");
	}

	@SuppressWarnings("unchecked")
	@GetMapping("/info")
	public Map<String, Object> info(@AuthenticationPrincipal Jwt jwt) {
		List<String> roles = jwt.getClaimAsStringList("groups");

		if (roles == null) {
			Map<String, Object> realmAccess = jwt.getClaim("realm_access");
			roles = realmAccess == null ? List.of() : (List<String>) realmAccess.getOrDefault("roles", List.of());
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("service", applicationName);
		response.put("contactEmail", supportEmail);
		response.put("message", "Protected test endpoint reached successfully.");
		response.put("authenticated", true);
		response.put("subject", jwt.getSubject());
		response.put("preferredUsername", jwt.getClaimAsString("preferred_username"));
		response.put("email", jwt.getClaimAsString("email"));
		response.put("roles", roles);
		return response;
	}
}
