import { api } from "@/lib/api";
import type { ChangePasswordInput, ProfileInput, UserProfile } from "@/types";

// Layer 3 — Service / API. The signed-in user's account profile + settings.

export async function getMyProfile(): Promise<UserProfile> {
  return (await api.get<UserProfile>("/me/profile")).data;
}

export async function updateMyProfile(input: ProfileInput): Promise<UserProfile> {
  return (await api.patch<UserProfile>("/me/profile", input)).data;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await api.post("/me/password", input);
}
