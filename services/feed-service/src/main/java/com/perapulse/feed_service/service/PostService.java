package com.perapulse.feed_service.service;

import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.perapulse.feed_service.dto.AuthorInfo;
import com.perapulse.feed_service.dto.CreatePostRequest;
import com.perapulse.feed_service.dto.PostResponse;
import com.perapulse.feed_service.kafka.FeedEventPublisher;
import com.perapulse.feed_service.model.Post;
import com.perapulse.feed_service.repository.CommentRepository;
import com.perapulse.feed_service.repository.PostLikeRepository;
import com.perapulse.feed_service.repository.PostRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepo;
    private final PostLikeRepository likeRepo;
    private final CommentRepository commentRepo;
    private final FeedEventPublisher eventPublisher;
    private final RestTemplate restTemplate;

    @Value("${user-service.base-url}")
    private String userServiceBaseUrl;

    // ── Create ────────────────────────────────────────────────────

    public Post createPost(String authorSub, CreatePostRequest req) {
        Post post = Post.builder()
                .authorSub(authorSub)
                .content(req.content())
                .mediaUrl(req.mediaUrl())
                .build();
        post = postRepo.save(post);

        // Fire Kafka event
        String snippet = post.getContent().length() > 100
                ? post.getContent().substring(0, 100) : post.getContent();
        eventPublisher.publishPostCreated(post.getId(), authorSub, snippet);

        return post;
    }

    // ── Read (paginated feed) ─────────────────────────────────────

    public Page<Post> getFeed(Pageable pageable) {
        return postRepo.findAllByOrderByCreatedAtDesc(pageable);
    }

    // ── Read single ───────────────────────────────────────────────

    public Post getPost(UUID postId) {
        return postRepo.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Post not found"));
    }

    // ── Delete (owner or admin) ───────────────────────────────────

    public void deletePost(UUID postId, String callerSub, boolean isAdmin) {
        Post post = getPost(postId);
        if (!post.getAuthorSub().equals(callerSub) && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only delete your own posts");
        }
        postRepo.delete(post);
    }

    // ── Build response DTO ────────────────────────────────────────

    public PostResponse toResponse(Post post, String currentUserSub) {
        long likeCount = likeRepo.countByPostId(post.getId());
        boolean likedByMe = currentUserSub != null
                && likeRepo.existsByPostIdAndUserSub(post.getId(), currentUserSub);
        long commentCount = commentRepo.countByPostId(post.getId());

        AuthorInfo author = fetchAuthorInfo(post.getAuthorSub());

        return new PostResponse(
                post.getId(),
                post.getAuthorSub(),
                author.displayName(),
                author.avatarUrl(),
                post.getContent(),
                post.getMediaUrl(),
                likeCount,
                likedByMe,
                commentCount,
                post.getCreatedAt());
    }

    // ── Profile enrichment via user-service ────────────────────────

    @SuppressWarnings("unchecked")
    private AuthorInfo fetchAuthorInfo(String sub) {
        try {
            String url = userServiceBaseUrl + "/api/profiles/" + sub;
            Map<String, Object> profile = restTemplate.getForObject(url, Map.class);
            if (profile != null) {
                return new AuthorInfo(
                        (String) profile.get("displayName"),
                        (String) profile.get("avatarUrl"));
            }
        } catch (Exception e) {
            log.warn("Could not fetch author info for sub={}: {}", sub, e.getMessage());
        }
        // Graceful degradation
        return new AuthorInfo(null, null);
    }
}
