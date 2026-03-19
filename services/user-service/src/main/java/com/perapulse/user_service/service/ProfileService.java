package com.perapulse.user_service.service;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perapulse.user_service.domain.RoleRequest;
import com.perapulse.user_service.domain.RoleRequestStatus;
import com.perapulse.user_service.domain.UserProfile;
import com.perapulse.user_service.domain.UserRole;
import com.perapulse.user_service.exception.ConflictException;
import com.perapulse.user_service.exception.NotFoundException;
import com.perapulse.user_service.repository.RoleRequestRepository;
import com.perapulse.user_service.repository.UserProfileRepository;
import com.perapulse.user_service.web.dto.RoleRequestResponse;
import com.perapulse.user_service.web.dto.SubmitRoleRequestRequest;
import com.perapulse.user_service.web.dto.UpdateMyProfileRequest;
import com.perapulse.user_service.web.dto.UserProfileResponse;

@Service
public class ProfileService {

	private final UserProfileRepository userProfileRepository;
	private final RoleRequestRepository roleRequestRepository;
	private final JwtUserContext jwtUserContext;

	public ProfileService(
			UserProfileRepository userProfileRepository,
			RoleRequestRepository roleRequestRepository,
			JwtUserContext jwtUserContext) {
		this.userProfileRepository = userProfileRepository;
		this.roleRequestRepository = roleRequestRepository;
		this.jwtUserContext = jwtUserContext;
	}

	@Transactional
	public UserProfileResponse getMyProfile(Jwt jwt) {
		return toUserProfileResponse(getOrCreateByJwt(jwt));
	}

	@Transactional
	public UserProfileResponse updateMyProfile(Jwt jwt, UpdateMyProfileRequest request) {
		UserProfile profile = getOrCreateByJwt(jwt);
		profile.setDisplayName(request.displayName());
		profile.setDepartment(request.department());
		profile.setGradYear(request.gradYear());
		profile.setBio(request.bio());
		profile.setLinkedinUrl(request.linkedinUrl());
		profile.setAvatarUrl(request.avatarUrl());
		return toUserProfileResponse(userProfileRepository.save(profile));
	}

	@Transactional(readOnly = true)
	public UserProfileResponse getProfileBySub(String sub) {
		UserProfile profile = userProfileRepository.findByKeycloakSub(sub)
				.orElseThrow(() -> new NotFoundException("Profile not found for subject: " + sub));
		return toPublicUserProfileResponse(profile);
	}

	@Transactional
	public RoleRequestResponse submitRoleRequest(Jwt jwt, SubmitRoleRequestRequest request) {
		String subject = jwtUserContext.subject(jwt);
		UserRole role = jwtUserContext.primaryRole(jwt);
		if (role != UserRole.STUDENT) {
			throw new IllegalArgumentException("Only STUDENT users can submit alumni role requests");
		}

		roleRequestRepository.findFirstByUserSubAndStatusOrderByCreatedAtDesc(subject, RoleRequestStatus.PENDING)
				.ifPresent(existing -> {
					throw new ConflictException("A pending role request already exists for this user");
				});

		RoleRequest roleRequest = new RoleRequest();
		roleRequest.setUserSub(subject);
		roleRequest.setRequestedRole(UserRole.ALUMNI);
		roleRequest.setGraduationYear(request.graduationYear());
		roleRequest.setEvidenceText(request.evidenceText());
		roleRequest.setStatus(RoleRequestStatus.PENDING);
		return toRoleRequestResponse(roleRequestRepository.save(roleRequest));
	}

	private UserProfile getOrCreateByJwt(Jwt jwt) {
		String subject = jwtUserContext.subject(jwt);
		return userProfileRepository.findByKeycloakSub(subject)
				.orElseGet(() -> {
					UserProfile created = new UserProfile();
					created.setKeycloakSub(subject);
					created.setRole(jwtUserContext.primaryRole(jwt));
					created.setEmail(jwtUserContext.email(jwt));
					created.setDisplayName(jwtUserContext.displayName(jwt));
					return userProfileRepository.save(created);
				});
	}

	public static UserProfileResponse toUserProfileResponse(UserProfile profile) {
		return new UserProfileResponse(
				profile.getKeycloakSub(),
				profile.getRole(),
				profile.getDisplayName(),
				profile.getEmail(),
				profile.getDepartment(),
				profile.getGradYear(),
				profile.getBio(),
				profile.getLinkedinUrl(),
				profile.getAvatarUrl(),
				profile.getCreatedAt(),
				profile.getUpdatedAt());
	}

	public static UserProfileResponse toPublicUserProfileResponse(UserProfile profile) {
		return new UserProfileResponse(
				profile.getKeycloakSub(),
				profile.getRole(),
				profile.getDisplayName(),
				null,
				profile.getDepartment(),
				profile.getGradYear(),
				profile.getBio(),
				profile.getLinkedinUrl(),
				profile.getAvatarUrl(),
				profile.getCreatedAt(),
				profile.getUpdatedAt());
	}

	public static RoleRequestResponse toRoleRequestResponse(RoleRequest request) {
		return new RoleRequestResponse(
				request.getId(),
				request.getUserSub(),
				request.getRequestedRole(),
				request.getGraduationYear(),
				request.getEvidenceText(),
				request.getStatus(),
				request.getReviewedBySub(),
				request.getCreatedAt(),
				request.getUpdatedAt());
	}
}
