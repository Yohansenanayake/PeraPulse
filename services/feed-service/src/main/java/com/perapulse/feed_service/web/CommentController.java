package com.perapulse.feed_service.web;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perapulse.feed_service.dto.CommentResponse;
import com.perapulse.feed_service.dto.CreateCommentRequest;
import com.perapulse.feed_service.model.Comment;
import com.perapulse.feed_service.service.CommentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID postId,
            @Valid @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal Jwt jwt) {

        Comment c = commentService.addComment(postId, jwt.getSubject(), req);
        CommentResponse resp = new CommentResponse(
                c.getId(), c.getAuthorSub(), null, c.getText(), c.getCreatedAt());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping
    public Page<CommentResponse> getComments(
            @PathVariable UUID postId,
            Pageable pageable) {

        return commentService.getComments(postId, pageable)
                .map(c -> new CommentResponse(
                        c.getId(), c.getAuthorSub(), null,
                        c.getText(), c.getCreatedAt()));
    }
}
