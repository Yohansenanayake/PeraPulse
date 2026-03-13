package com.perapulse.user_service.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "role_request")
public class RoleRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "user_sub", nullable = false, length = 255)
	private String userSub;

	@Enumerated(EnumType.STRING)
	@Column(name = "requested_role", nullable = false, length = 50)
	private UserRole requestedRole = UserRole.ALUMNI;

	@Column(name = "graduation_year")
	private Integer graduationYear;

	@Column(name = "evidence_text", columnDefinition = "TEXT")
	private String evidenceText;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 50)
	private RoleRequestStatus status = RoleRequestStatus.PENDING;

	@Column(name = "reviewed_by_sub", length = 255)
	private String reviewedBySub;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	public void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		if (createdAt == null) {
			createdAt = now;
		}
		updatedAt = now;
	}

	@PreUpdate
	public void preUpdate() {
		updatedAt = LocalDateTime.now();
	}

	public UUID getId() {
		return id;
	}

	public String getUserSub() {
		return userSub;
	}

	public void setUserSub(String userSub) {
		this.userSub = userSub;
	}

	public UserRole getRequestedRole() {
		return requestedRole;
	}

	public void setRequestedRole(UserRole requestedRole) {
		this.requestedRole = requestedRole;
	}

	public Integer getGraduationYear() {
		return graduationYear;
	}

	public void setGraduationYear(Integer graduationYear) {
		this.graduationYear = graduationYear;
	}

	public String getEvidenceText() {
		return evidenceText;
	}

	public void setEvidenceText(String evidenceText) {
		this.evidenceText = evidenceText;
	}

	public RoleRequestStatus getStatus() {
		return status;
	}

	public void setStatus(RoleRequestStatus status) {
		this.status = status;
	}

	public String getReviewedBySub() {
		return reviewedBySub;
	}

	public void setReviewedBySub(String reviewedBySub) {
		this.reviewedBySub = reviewedBySub;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
