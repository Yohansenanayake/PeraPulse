package com.perapulse.feed_service.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.perapulse.feed_service.model.PostLike;
import com.perapulse.feed_service.model.PostLikeId;

public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {

    long countByPostId(UUID postId);

    boolean existsByPostIdAndUserSub(UUID postId, String userSub);
}
