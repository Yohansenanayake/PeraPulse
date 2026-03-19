package com.perapulse.feed_service.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.perapulse.feed_service.kafka.FeedEventPublisher;
import com.perapulse.feed_service.model.Post;
import com.perapulse.feed_service.model.PostLike;
import com.perapulse.feed_service.model.PostLikeId;
import com.perapulse.feed_service.repository.PostLikeRepository;
import com.perapulse.feed_service.repository.PostRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final PostLikeRepository likeRepo;
    private final PostRepository postRepo;
    private final FeedEventPublisher eventPublisher;

    public void likePost(UUID postId, String userSub) {
        if (likeRepo.existsByPostIdAndUserSub(postId, userSub)) {
            return; // idempotent — already liked
        }

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Post not found"));

        likeRepo.save(PostLike.builder()
                .postId(postId)
                .userSub(userSub)
                .build());

        eventPublisher.publishPostLiked(postId, userSub, post.getAuthorSub());
    }

    public void unlikePost(UUID postId, String userSub) {
        PostLikeId id = new PostLikeId(postId, userSub);
        if (likeRepo.existsById(id)) {
            likeRepo.deleteById(id);
        }
    }
}
