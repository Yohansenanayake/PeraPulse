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
@Table(name = "user_profile")
public class UserProfile {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "keycloak_sub", nullable = false, unique = true, length = 255)
	private String keycloakSub;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 50)
	private UserRole role;

	@Column(name = "display_name", length = 255)
	private String displayName;

	@Column(length = 255)
	private String email;

	@Column(length = 255)
	private String department;

	@Column(name = "grad_year")
	private Integer gradYear;

	@Column(columnDefinition = "TEXT")
	private String bio;

	@Column(name = "linkedin_url", length = 500)
	private String linkedinUrl;

	@Column(name = "avatar_url", length = 500)
	private String avatarUrl;

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

	public String getKeycloakSub() {
		return keycloakSub;
	}

	public void setKeycloakSub(String keycloakSub) {
		this.keycloakSub = keycloakSub;
	}

	public UserRole getRole() {
		return role;
	}

	public void setRole(UserRole role) {
		this.role = role;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}

	public Integer getGradYear() {
		return gradYear;
	}

	public void setGradYear(Integer gradYear) {
		this.gradYear = gradYear;
	}

	public String getBio() {
		return bio;
	}

	public void setBio(String bio) {
		this.bio = bio;
	}

	public String getLinkedinUrl() {
		return linkedinUrl;
	}

	public void setLinkedinUrl(String linkedinUrl) {
		this.linkedinUrl = linkedinUrl;
	}

	public String getAvatarUrl() {
		return avatarUrl;
	}

	public void setAvatarUrl(String avatarUrl) {
		this.avatarUrl = avatarUrl;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
