import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAllNotificationsRead } from "@/services/notifications";

export const notificationKeys = {
  inbox: ["notifications", "inbox"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.inbox,
    queryFn: getNotifications,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.inbox }),
  });
}
