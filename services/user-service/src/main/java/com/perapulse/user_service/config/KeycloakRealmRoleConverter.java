package com.perapulse.user_service.config;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

public class KeycloakRealmRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

	@Override
	@SuppressWarnings("unchecked")
	public Collection<GrantedAuthority> convert(Jwt jwt) {
		List<String> roleNames = jwt.getClaimAsStringList("groups");
		if (roleNames == null || roleNames.isEmpty()) {
			Map<String, Object> realmAccess = jwt.getClaim("realm_access");
			if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> rawRoles) {
				roleNames = rawRoles.stream().map(String::valueOf).toList();
			}
		}
		if (roleNames == null || roleNames.isEmpty()) {
			return List.of();
		}
		return roleNames.stream()
				.map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
				.map(String::toUpperCase)
				.map(SimpleGrantedAuthority::new)
				.map(GrantedAuthority.class::cast)
				.toList();
	}
}
