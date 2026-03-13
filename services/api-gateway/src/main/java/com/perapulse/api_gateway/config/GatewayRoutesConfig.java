package com.perapulse.api_gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {

	@Bean
	RouteLocator gatewayRoutes(
			RouteLocatorBuilder builder,
			@Value("${KEYCLOAK_INTERNAL_URL:http://keycloak:8080}") String keycloakInternalUrl,
			@Value("${USER_SERVICE_URL:http://localhost:8081}") String userServiceUrl) {
		return builder.routes()
				.route("keycloak", route -> route
						.path("/auth/**")
						.filters(filters -> filters.preserveHostHeader())
						.uri(keycloakInternalUrl))
				.route("user-service", route -> route
						.path("/api/users/**", "/api/profiles/**", "/api/admin/**")
						.uri(userServiceUrl))
				.build();
	}
}
