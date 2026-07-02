import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAssistantConfig,
  toggleConversationAI,
  updateAssistantConfig,
} from "@/services/assistant";
import { messageKeys } from "@/queries/useMessages";
import type { AssistantConfig } from "@/types";

// Layer 2 — Query hooks.
export const assistantKeys = {
  config: ["assistant", "config"] as const,
};

export function useAssistantConfig() {
  return useQuery({
    queryKey: assistantKeys.config,
    queryFn: getAssistantConfig,
  });
}

export function useUpdateAssistantConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AssistantConfig>) =>
      updateAssistantConfig(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.config });
    },
  });
}

export function useToggleConversationAI(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      toggleConversationAI(conversationId, enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
      qc.invalidateQueries({ queryKey: messageKeys.thread(conversationId) });
    },
  });
}
