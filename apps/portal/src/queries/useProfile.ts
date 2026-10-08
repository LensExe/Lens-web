import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changePassword, getMyProfile, updateMyProfile } from "@/services/profile";
import { isSignedIn } from "@/lib/session";

// Layer 2 — Query hooks for the account profile.
export const profileKeys = {
  me: ["profile", "me"] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getMyProfile,
    enabled: isSignedIn,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      qc.setQueryData(profileKeys.me, profile);
      // A photographer's name also shows on their public profile/dashboard.
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["photographers"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
