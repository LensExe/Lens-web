import { avatar } from "@lens/ui";
import { authApi, customerApi, identityApi, photographerApi } from "@/services/backend";
import { currentUser } from "@/lib/session";
import type { ChangePasswordInput, ProfileInput, UserProfile } from "@/types";

export async function getMyProfile(): Promise<UserProfile> {
  const user = await identityApi.getMe();
  const [customer, photographer] = await Promise.all([
    currentUser.role === "client" ? customerApi.getMyCustomerProfile().catch(() => null) : Promise.resolve(null),
    currentUser.role === "photographer" ? photographerApi.getMyPhotographerProfile().catch(() => null) : Promise.resolve(null),
  ]);
  const workProfile = (customer ?? photographer ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    name: user.fullname,
    email: user.email,
    avatar: user.avatar_url || avatar(user.id),
    phone: user.phone_number ?? "",
    birthday: user.dob ?? "",
    gender: user.gender ?? "",
    city: typeof workProfile.location === "string" ? workProfile.location : "",
    addressDetail: "",
    // Notification preferences are not exposed by lens-backend yet.
    notifications: { bookingUpdates: false, messages: false, promotions: false, emailDigest: false },
  };
}

export async function updateMyProfile(input: ProfileInput): Promise<UserProfile> {
  const identityPatch = {
    ...(input.name !== undefined && { fullname: input.name }),
    ...(input.phone !== undefined && input.phone && { phone_number: input.phone }),
    ...(input.birthday !== undefined && input.birthday && { dob: input.birthday }),
    ...(input.gender !== undefined && input.gender && { gender: input.gender }),
  };
  if (Object.keys(identityPatch).length) await identityApi.updateMe(identityPatch);

  if (input.city !== undefined) {
    if (currentUser.role === "client") {
      await customerApi.updateMyCustomerProfile({ location: input.city || null });
    } else {
      await photographerApi.updateMyPhotographerLocation({ location: input.city });
    }
  }
  return getMyProfile();
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await authApi.changePassword({
    current_password: input.currentPassword,
    new_password: input.newPassword,
    confirm_password: input.newPassword,
  });
}
