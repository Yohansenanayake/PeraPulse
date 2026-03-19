package com.perapulse.opportunities_service.config;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

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
}
