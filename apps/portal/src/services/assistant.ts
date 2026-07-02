import { api } from "@/lib/api";
import type { AssistantConfig, Conversation } from "@/types";

// Layer 3 — Service / API.

export async function getAssistantConfig(): Promise<AssistantConfig> {
  return (await api.get<AssistantConfig>("/me/assistant")).data;
}

export async function updateAssistantConfig(
  patch: Partial<AssistantConfig>
): Promise<AssistantConfig> {
  return (await api.patch<AssistantConfig>("/me/assistant", patch)).data;
}

/** Turn the AI assistant on/off for a single conversation. */
export async function toggleConversationAI(
  conversationId: string,
  enabled: boolean
): Promise<Conversation> {
  return (
    await api.post<Conversation>(`/conversations/${conversationId}/ai`, {
      enabled,
    })
  ).data;
}
