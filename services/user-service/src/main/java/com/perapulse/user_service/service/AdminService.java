package com.perapulse.user_service.service;

import java.util.List;
import java.util.UUID;

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
import com.perapulse.user_service.web.dto.UserProfileResponse;

@Service
public class AdminService {

	private final UserProfileRepository userProfileRepository;
	private final RoleRequestRepository roleRequestRepository;
	private final JwtUserContext jwtUserContext;

	public AdminService(
			UserProfileRepository userProfileRepository,
			RoleRequestRepository roleRequestRepository,
			JwtUserContext jwtUserContext) {
		this.userProfileRepository = userProfileRepository;
		this.roleRequestRepository = roleRequestRepository;
		this.jwtUserContext = jwtUserContext;
	}

	@Transactional(readOnly = true)
	public List<UserProfileResponse> listUsers(UserRole role) {
		List<UserProfile> users = role == null
				? userProfileRepository.findAllByOrderByCreatedAtDesc()
				: userProfileRepository.findAllByRoleOrderByCreatedAtDesc(role);
		return users.stream().map(ProfileService::toUserProfileResponse).toList();
	}

	@Transactional(readOnly = true)
	public UserProfileResponse getUserBySub(String sub) {
		UserProfile user = userProfileRepository.findByKeycloakSub(sub)
				.orElseThrow(() -> new NotFoundException("User not found for subject: " + sub));
		return ProfileService.toUserProfileResponse(user);
	}

	@Transactional(readOnly = true)
	public List<RoleRequestResponse> listRoleRequests(RoleRequestStatus status) {
		List<RoleRequest> requests = status == null
				? roleRequestRepository.findAllByOrderByCreatedAtDesc()
				: roleRequestRepository.findAllByStatusOrderByCreatedAtDesc(status);
		return requests.stream().map(ProfileService::toRoleRequestResponse).toList();
	}

	@Transactional
	public RoleRequestResponse approve(UUID requestId, Jwt jwt) {
		RoleRequest request = findPendingRequest(requestId);
		String reviewerSub = jwtUserContext.subject(jwt);
		request.setStatus(RoleRequestStatus.APPROVED);
		request.setReviewedBySub(reviewerSub);
		promoteUserProfileRole(request.getUserSub(), UserRole.ALUMNI);
		return ProfileService.toRoleRequestResponse(roleRequestRepository.save(request));
	}

	@Transactional
	public RoleRequestResponse reject(UUID requestId, Jwt jwt) {
		RoleRequest request = findPendingRequest(requestId);
		String reviewerSub = jwtUserContext.subject(jwt);
		request.setStatus(RoleRequestStatus.REJECTED);
		request.setReviewedBySub(reviewerSub);
		return ProfileService.toRoleRequestResponse(roleRequestRepository.save(request));
	}

	private RoleRequest findPendingRequest(UUID requestId) {
		RoleRequest request = roleRequestRepository.findById(requestId)
				.orElseThrow(() -> new NotFoundException("Role request not found: " + requestId));
		if (request.getStatus() != RoleRequestStatus.PENDING) {
			throw new ConflictException("Role request is already " + request.getStatus());
		}
		return request;
	}

	private void promoteUserProfileRole(String userSub, UserRole role) {
		UserProfile profile = userProfileRepository.findByKeycloakSub(userSub)
				.orElseGet(() -> {
					UserProfile created = new UserProfile();
					created.setKeycloakSub(userSub);
					created.setRole(UserRole.STUDENT);
					return created;
				});
		profile.setRole(role);
		userProfileRepository.save(profile);
	}
}
