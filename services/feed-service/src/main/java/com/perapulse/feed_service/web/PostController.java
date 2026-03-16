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

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody CreatePostRequest req,
            @AuthenticationPrincipal Jwt jwt) {

        Post post = postService.createPost(jwt.getSubject(), req);
        PostResponse response = postService.toResponse(post, jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public Page<PostResponse> getFeed(
            Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {

        return postService.getFeed(pageable)
                .map(post -> postService.toResponse(post, jwt.getSubject()));
    }

    @GetMapping("/{postId}")
    public PostResponse getPost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal Jwt jwt) {

        Post post = postService.getPost(postId);
        return postService.toResponse(post, jwt.getSubject());
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal Jwt jwt) {

        boolean isAdmin = hasRole(jwt, "ADMIN");
        postService.deletePost(postId, jwt.getSubject(), isAdmin);
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
