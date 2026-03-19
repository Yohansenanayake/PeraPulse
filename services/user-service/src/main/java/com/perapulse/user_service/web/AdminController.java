package com.perapulse.user_service.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perapulse.user_service.domain.RoleRequestStatus;
import com.perapulse.user_service.domain.UserRole;
import com.perapulse.user_service.service.AdminService;
import com.perapulse.user_service.web.dto.RoleRequestResponse;
import com.perapulse.user_service.web.dto.UserProfileResponse;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

	private final AdminService adminService;

	public AdminController(AdminService adminService) {
		this.adminService = adminService;
	}

	@GetMapping("/users")
	public List<UserProfileResponse> listUsers(@RequestParam(name = "role", required = false) UserRole role) {
		return adminService.listUsers(role);
	}

	@GetMapping("/users/{sub}")
	public UserProfileResponse getUserBySub(@PathVariable("sub") String sub) {
		return adminService.getUserBySub(sub);
	}

	@GetMapping("/role-requests")
	public List<RoleRequestResponse> listRoleRequests(
			@RequestParam(name = "status", required = false) RoleRequestStatus status) {
		return adminService.listRoleRequests(status);
	}

	@PutMapping("/role-requests/{id}/approve")
	public RoleRequestResponse approveRoleRequest(
			@PathVariable("id") UUID id,
			@AuthenticationPrincipal Jwt jwt) {
		return adminService.approve(id, jwt);
	}

	@PutMapping("/role-requests/{id}/reject")
	public RoleRequestResponse rejectRoleRequest(
			@PathVariable("id") UUID id,
			@AuthenticationPrincipal Jwt jwt) {
		return adminService.reject(id, jwt);
	}
}
