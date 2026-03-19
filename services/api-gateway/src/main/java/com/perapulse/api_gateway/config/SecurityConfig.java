package com.perapulse.api_gateway.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

	// Chain 1: Keycloak proxy paths — pass through with no JWT processing.
	// Tokens on /auth/** belong to the master realm; validating them here
	// against the perapulse realm JWK endpoint would always fail.
	@Bean
	@Order(1)
	SecurityWebFilterChain keycloakFilterChain(ServerHttpSecurity http) {
		return http
				.securityMatcher(ServerWebExchangeMatchers.pathMatchers("/auth/**"))
				.authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
				.csrf(ServerHttpSecurity.CsrfSpec::disable)
				.build();
	}

	// Chain 2: All other paths — JWT validation against the perapulse realm.
	@Bean
	@Order(2)
	SecurityWebFilterChain apiFilterChain(ServerHttpSecurity http) {
		return http
				.csrf(ServerHttpSecurity.CsrfSpec::disable)
				.cors(Customizer.withDefaults())
				.authorizeExchange(exchanges -> exchanges
						.pathMatchers("/", "/index.html", "/app.js").permitAll()
						.pathMatchers("/actuator/health", "/actuator/info").permitAll()
						.pathMatchers(HttpMethod.GET, "/api/users/public-info").permitAll()
						.pathMatchers("/api/**").authenticated()
						.anyExchange().permitAll())
				.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
				.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of(
				"http://localhost:5173",
				"https://perapulse.org",
				"http://perapulse.org"
		));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", configuration);
		return source;
	}
}
