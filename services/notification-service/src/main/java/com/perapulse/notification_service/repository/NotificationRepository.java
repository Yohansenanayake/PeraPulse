package com.perapulse.notification_service.repository;

import com.perapulse.notification_service.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * Fetch paginated notifications for a user — includes personal notifications
     * AND broadcast ones (ALL_USERS, ALL_STUDENTS, ALL_ADMINS).
     */
    Page<Notification> findByUserSubInOrderByCreatedAtDesc(List<String> userSubs, Pageable pageable);

    /**
     * Count unread notifications across personal + broadcast subs.
     */
    long countByUserSubInAndReadFalse(List<String> userSubs);

    /**
     * Mark a single notification as read. Scoped to userSubs to prevent
     * users from marking other people's notifications.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.userSub IN :userSubs")
    int markAsRead(@Param("id") UUID id, @Param("userSubs") List<String> userSubs);

    /**
     * Mark all notifications as read for the given subs.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.userSub IN :userSubs AND n.read = false")
    int markAllAsRead(@Param("userSubs") List<String> userSubs);
}
