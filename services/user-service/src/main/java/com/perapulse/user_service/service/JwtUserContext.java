package com.perapulse.user_service.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.perapulse.user_service.domain.UserRole;

@Component
public class JwtUserContext {

	public String subject(Jwt jwt) {
		String subject = jwt.getSubject();
		if (subject == null || subject.isBlank()) {
			subject = jwt.getClaimAsString("sub");
		}
		if (subject == null || subject.isBlank()) {
			subject = jwt.getClaimAsString("preferred_username");
		}
		if (subject == null || subject.isBlank()) {
			subject = jwt.getClaimAsString("email");
		}
		if (subject == null || subject.isBlank()) {
			throw new IllegalArgumentException("Token does not contain a usable subject identifier");
		}
		return subject;
	}

	public String email(Jwt jwt) {
		return jwt.getClaimAsString("email");
	}

	public String displayName(Jwt jwt) {
		String name = jwt.getClaimAsString("name");
		if (name != null && !name.isBlank()) {
			return name;
		}
		String preferredUsername = jwt.getClaimAsString("preferred_username");
		return preferredUsername == null || preferredUsername.isBlank() ? null : preferredUsername;
	}

	public Set<UserRole> roles(Jwt jwt) {
		List<String> roleNames = jwt.getClaimAsStringList("groups");
		if (roleNames == null || roleNames.isEmpty()) {
			roleNames = extractRealmRoles(jwt.getClaim("realm_access"));
		}
		if (roleNames == null) {
			return Set.of();
		}
		return roleNames.stream()
				.map(role -> role.replace("ROLE_", ""))
				.map(String::toUpperCase)
				.filter(this::isKnownRole)
				.map(UserRole::valueOf)
				.collect(Collectors.toSet());
	}

	public UserRole primaryRole(Jwt jwt) {
		Set<UserRole> roles = roles(jwt);
		if (roles.contains(UserRole.ADMIN)) {
			return UserRole.ADMIN;
		}
		if (roles.contains(UserRole.ALUMNI)) {
			return UserRole.ALUMNI;
		}
		return UserRole.STUDENT;
	}

	@SuppressWarnings("unchecked")
	private List<String> extractRealmRoles(Object realmAccessClaim) {
		if (!(realmAccessClaim instanceof Map<?, ?> realmAccess)) {
			return List.of();
		}
		Object rolesObj = realmAccess.get("roles");
		if (!(rolesObj instanceof Collection<?> roles)) {
			return List.of();
		}
		return roles.stream().map(String::valueOf).toList();
	}

	private boolean isKnownRole(String role) {
		return "STUDENT".equals(role) || "ALUMNI".equals(role) || "ADMIN".equals(role);
	}
}
