import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyCollaborations,
  inviteCollaborator,
  respondToInvite,
  type InviteInput,
} from "@/services/collaborations";
import { dashboardKeys } from "@/queries/useDashboard";

// Layer 2 — Query hooks.
export const collaborationKeys = {
  mine: ["collaborations", "mine"] as const,
};

export function useMyCollaborations() {
  return useQuery({
    queryKey: collaborationKeys.mine,
    queryFn: getMyCollaborations,
  });
}

export function useInviteCollaborator(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteInput) => inviteCollaborator(bookingId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.incoming });
    },
  });
}

export function useRespondToInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: "accepted" | "declined";
    }) => respondToInvite(bookingId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: collaborationKeys.mine });
    },
  });
}
