package com.perapulse.feed_service.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.perapulse.feed_service.dto.CreateCommentRequest;
import com.perapulse.feed_service.kafka.FeedEventPublisher;
import com.perapulse.feed_service.model.Comment;
import com.perapulse.feed_service.model.Post;
import com.perapulse.feed_service.repository.CommentRepository;
import com.perapulse.feed_service.repository.PostRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepo;
    private final PostRepository postRepo;
    private final FeedEventPublisher eventPublisher;

    public Comment addComment(UUID postId, String authorSub, CreateCommentRequest req) {
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Post not found"));

        Comment comment = Comment.builder()
                .postId(postId)
                .authorSub(authorSub)
                .text(req.text())
                .build();
        comment = commentRepo.save(comment);

        eventPublisher.publishCommentAdded(
                postId, comment.getId(), authorSub, post.getAuthorSub());

        return comment;
    }

    public Page<Comment> getComments(UUID postId, Pageable pageable) {
        // Verify post exists
        if (!postRepo.existsById(postId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Post not found");
        }
        return commentRepo.findByPostIdOrderByCreatedAtAsc(postId, pageable);
    }
}
