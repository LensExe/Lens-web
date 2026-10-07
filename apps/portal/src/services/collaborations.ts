import type { Booking } from "@/types";

export interface InviteInput {
  photographerId: string;
  photographerName: string;
  photographerAvatar: string;
  sharePct: number;
}

const unsupported = () => new Error("API cộng tác viên trong lens-backend hiện bị vô hiệu hoá.");

export async function inviteCollaborator(bookingId: string, input: InviteInput): Promise<Booking> { void bookingId; void input; throw unsupported(); }
export async function getMyCollaborations(): Promise<Booking[]> { throw unsupported(); }
export async function respondToInvite(bookingId: string, status: "accepted" | "declined"): Promise<Booking> { void bookingId; void status; throw unsupported(); }
