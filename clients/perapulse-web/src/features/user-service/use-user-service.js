import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { profilesApi } from "@/api/profiles";

const userServiceKeys = {
  myProfile: ["user-service", "my-profile"],
  publicProfile: (sub) => ["user-service", "profile", sub],
  adminUsers: (role) => ["user-service", "admin-users", role ?? "ALL"],
  adminUser: (sub) => ["user-service", "admin-user", sub],
  roleRequests: (status) => ["user-service", "role-requests", status ?? "ALL"],
};

function invalidateUserDirectories(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["user-service", "admin-users"] });
}

function invalidateRoleRequests(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["user-service", "role-requests"] });
}

export function useMyProfile() {
  return useQuery({
    queryKey: userServiceKeys.myProfile,
    queryFn: () => profilesApi.getMyProfile(),
  });
}

export function usePublicProfile(sub) {
  return useQuery({
    queryKey: userServiceKeys.publicProfile(sub),
    queryFn: () => profilesApi.getProfile(sub),
    enabled: Boolean(sub),
  });
}

export function useAdminUsers(role, options = {}) {
  return useQuery({
    queryKey: userServiceKeys.adminUsers(role),
    queryFn: () => profilesApi.getUsers(role),
    enabled: options.enabled ?? true,
  });
}

export function useAdminUser(sub) {
  return useQuery({
    queryKey: userServiceKeys.adminUser(sub),
    queryFn: () => profilesApi.getUser(sub),
    enabled: Boolean(sub),
  });
}

export function useAdminRoleRequests(status) {
  return useQuery({
    queryKey: userServiceKeys.roleRequests(status),
    queryFn: () => profilesApi.getRoleRequests(status),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => profilesApi.updateMyProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(userServiceKeys.myProfile, profile);
      queryClient.setQueryData(
        userServiceKeys.publicProfile(profile.keycloakSub),
        profile
      );
      queryClient.setQueryData(
        userServiceKeys.adminUser(profile.keycloakSub),
        profile
      );
      invalidateUserDirectories(queryClient);
    },
  });
}

export function useSubmitRoleRequest(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => profilesApi.submitRoleRequest(payload),
    onSuccess: (request) => {
      invalidateRoleRequests(queryClient);
      options.onSuccess?.(request);
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
}

export function useApproveRoleRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => profilesApi.approveRoleRequest(id),
    onSuccess: (request) => {
      invalidateRoleRequests(queryClient);
      queryClient.invalidateQueries({ queryKey: userServiceKeys.myProfile });
      queryClient.invalidateQueries({
        queryKey: userServiceKeys.publicProfile(request.userSub),
      });
      queryClient.invalidateQueries({
        queryKey: userServiceKeys.adminUser(request.userSub),
      });
      invalidateUserDirectories(queryClient);
    },
  });
}

export function useRejectRoleRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => profilesApi.rejectRoleRequest(id),
    onSuccess: () => {
      invalidateRoleRequests(queryClient);
    },
  });
}
