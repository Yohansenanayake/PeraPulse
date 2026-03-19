package com.perapulse.feed_service.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perapulse.feed_service.service.LikeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    private String resolveSub(Jwt jwt) {
        String sub = jwt.getSubject();
        if (sub != null) return sub;
        String username = jwt.getClaimAsString("preferred_username");
        if (username != null) return username;
        return "unknown";
    }

    @PostMapping
    public ResponseEntity<Void> like(
            @PathVariable UUID postId,
            @AuthenticationPrincipal Jwt jwt) {

        likeService.likePost(postId, resolveSub(jwt));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> unlike(
            @PathVariable UUID postId,
            @AuthenticationPrincipal Jwt jwt) {

        likeService.unlikePost(postId, resolveSub(jwt));
        return ResponseEntity.noContent().build();
    }
}
