package com.perapulse.user_service.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perapulse.user_service.service.ProfileService;
import com.perapulse.user_service.web.dto.RoleRequestResponse;
import com.perapulse.user_service.web.dto.SubmitRoleRequestRequest;
import com.perapulse.user_service.web.dto.UpdateMyProfileRequest;
import com.perapulse.user_service.web.dto.UserProfileResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profiles")
@Validated
public class ProfileController {

	private final ProfileService profileService;

	public ProfileController(ProfileService profileService) {
		this.profileService = profileService;
	}

	@GetMapping("/me")
	@PreAuthorize("isAuthenticated()")
	public UserProfileResponse getMyProfile(@AuthenticationPrincipal Jwt jwt) {
		return profileService.getMyProfile(jwt);
	}

	@PutMapping("/me")
	@PreAuthorize("isAuthenticated()")
	public UserProfileResponse updateMyProfile(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody UpdateMyProfileRequest request) {
		return profileService.updateMyProfile(jwt, request);
	}

	@GetMapping("/{sub}")
	@PreAuthorize("isAuthenticated()")
	public UserProfileResponse getProfileBySub(@PathVariable("sub") String sub) {
		return profileService.getProfileBySub(sub);
	}

	@PostMapping("/role-requests")
	@PreAuthorize("hasRole('STUDENT')")
	public RoleRequestResponse submitRoleRequest(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody SubmitRoleRequestRequest request) {
		return profileService.submitRoleRequest(jwt, request);
	}
}
