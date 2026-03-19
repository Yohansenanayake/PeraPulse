package com.perapulse.feed_service.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perapulse.feed_service.dto.CreatePostRequest;
import com.perapulse.feed_service.dto.PostResponse;
import com.perapulse.feed_service.model.Post;
import com.perapulse.feed_service.service.PostService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

    private final PostService postService;

    /** Resolve caller identity: Keycloak 26 omits 'sub' in OIDC access tokens,
     *  so fall back to 'preferred_username' (unique email in this realm). */
    private String resolveSub(Jwt jwt) {
        String sub = jwt.getSubject(); // standard 'sub' claim
        if (sub != null) return sub;
        // Keycloak 26 OIDC fallback
        String username = jwt.getClaimAsString("preferred_username");
        if (username != null) return username;
        throw new ResponseStatusException(
            org.springframework.http.HttpStatus.UNAUTHORIZED,
            "Unable to identify caller from JWT");
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody CreatePostRequest req,
            @AuthenticationPrincipal Jwt jwt) {

        String callerSub = resolveSub(jwt);
        log.debug("createPost: caller={}", callerSub);
        Post post = postService.createPost(callerSub, req);
        PostResponse response = postService.toResponse(post, callerSub);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public Page<PostResponse> getFeed(
            Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {

        return postService.getFeed(pageable)
                .map(post -> postService.toResponse(post, resolveSub(jwt)));
    }

    @GetMapping("/{postId}")
    public PostResponse getPost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal Jwt jwt) {

        Post post = postService.getPost(postId);
        return postService.toResponse(post, resolveSub(jwt));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal Jwt jwt) {

        boolean isAdmin = hasRole(jwt, "ADMIN");
        postService.deletePost(postId, resolveSub(jwt), isAdmin);
        return ResponseEntity.noContent().build();
    }

    // ── Helper ──────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private boolean hasRole(Jwt jwt, String role) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) {
            return false;
        }
        List<String> roles = (List<String>) realmAccess.get("roles");
        return roles != null && roles.contains(role);
    }
}
