import { api } from "@/lib/api";
import type { Booking } from "@/types";

// Layer 3 — Service / API for multi-photographer shoots (liên kết thợ).

export interface InviteInput {
  photographerId: string;
  photographerName: string;
  photographerAvatar: string;
  sharePct: number;
}

/** Lead photographer invites another photographer to a shoot they lead. */
export async function inviteCollaborator(
  bookingId: string,
  input: InviteInput
): Promise<Booking> {
  return (
    await api.post<Booking>(`/me/bookings/${bookingId}/collaborators`, input)
  ).data;
}

/** Shoots where the signed-in photographer is invited as a collaborator. */
export async function getMyCollaborations(): Promise<Booking[]> {
  return (await api.get<Booking[]>("/me/collaborations")).data;
}

/** Invited photographer accepts or declines their agreed share. */
export async function respondToInvite(
  bookingId: string,
  status: "accepted" | "declined"
): Promise<Booking> {
  return (
    await api.patch<Booking>(`/me/collaborations/${bookingId}`, { status })
  ).data;
}
