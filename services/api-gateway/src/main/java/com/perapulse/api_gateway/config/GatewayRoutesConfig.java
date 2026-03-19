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
			@Value("${USER_SERVICE_URL:http://user-service:8081}") String userServiceUrl,
			@Value("${FEED_SERVICE_URL:http://feed-service:8082}") String feedServiceUrl,
			@Value("${OPPORTUNITIES_SERVICE_URL:http://opportunities-service:8083}") String opportunitiesServiceUrl,
			@Value("${EVENTS_SERVICE_URL:http://events-service:8084}") String eventsServiceUrl,
			@Value("${NOTIFICATION_SERVICE_URL:http://notification-service:8085}") String notificationServiceUrl,
			@Value("${ANALYTICS_SERVICE_URL:http://analytics-service:8086}") String analyticsServiceUrl) {
		return builder.routes()
				// ── Keycloak ──────────────────────────────────────────────────────────
				.route("keycloak", route -> route
						.path("/auth/**")
						.filters(filters -> filters.preserveHostHeader())
						.uri(keycloakInternalUrl))
				// ── User / Profile / Admin ─────────────────────────────────────────
				.route("user-service", route -> route
						.path("/api/users/**", "/api/profiles/**", "/api/admin/**")
						.uri(userServiceUrl))
				// ── Feed (posts, comments, likes) ─────────────────────────────────
				.route("feed-service", route -> route
						.path("/api/posts/**")
						.uri(feedServiceUrl))
				// ── Opportunities (listings + applications) ───────────────────────
				.route("opportunities-service-apps", route -> route
						.path("/api/applications/**")
						.uri(opportunitiesServiceUrl))
				.route("opportunities-service", route -> route
						.path("/api/opportunities/**")
						.uri(opportunitiesServiceUrl))
				// ── Events (events + RSVPs) ────────────────────────────────────────
				.route("events-service", route -> route
						.path("/api/events/**")
						.uri(eventsServiceUrl))
				// ── Notifications ──────────────────────────────────────────────────
				.route("notification-service", route -> route
						.path("/api/notifications/**")
						.uri(notificationServiceUrl))
				// ── Analytics (admin only) ─────────────────────────────────────────
				.route("analytics-service", route -> route
						.path("/api/analytics/**")
						.uri(analyticsServiceUrl))
				.build();
	}
}
