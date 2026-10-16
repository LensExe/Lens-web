import {
  backendDelete,
  backendGet,
  backendPatch,
  backendPost,
} from "@/lib/backend-api";
import type {
  AiAssistantFaq,
  AiAssistantFaqInput,
  AiAssistantSettings,
  AiReplySuggestion,
} from "@/types";

interface ApiAiReplySuggestion {
  id: string;
  message_id: string;
  channel_id: string;
  action: "answer" | "ask_clarification" | "handoff";
  intent: string;
  suggested_reply: string | null;
  retrieval_similarity: number | null;
  risk_flags: string[];
  status: string;
  failure_reason: string | null;
  created_at: string;
}

export function getAssistantConfig(): Promise<AiAssistantSettings> {
  return backendGet<AiAssistantSettings>("/photographers/me/ai-assistant");
}

export function updateAssistantConfig(
  patch: Partial<AiAssistantSettings>,
): Promise<AiAssistantSettings> {
  return backendPatch<AiAssistantSettings, Partial<AiAssistantSettings>>(
    "/photographers/me/ai-assistant",
    patch,
  );
}

export async function getAssistantReplySuggestions(): Promise<AiReplySuggestion[]> {
  const rows = await backendGet<ApiAiReplySuggestion[]>(
    "/photographers/me/ai-reply-suggestions",
  );
  return rows.map((row) => ({
    id: row.id,
    messageId: row.message_id,
    channelId: row.channel_id,
    action: row.action,
    intent: row.intent,
    suggestedReply: row.suggested_reply,
    retrievalSimilarity: row.retrieval_similarity,
    riskFlags: row.risk_flags,
    status: row.status,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
  }));
}

export function getAssistantFaqs(): Promise<AiAssistantFaq[]> {
  return backendGet<AiAssistantFaq[]>("/photographers/me/ai-assistant/faqs");
}

export function createAssistantFaq(
  input: AiAssistantFaqInput,
): Promise<AiAssistantFaq> {
  return backendPost<AiAssistantFaq, AiAssistantFaqInput>(
    "/photographers/me/ai-assistant/faqs",
    input,
  );
}

export function updateAssistantFaq(
  id: string,
  patch: Partial<AiAssistantFaqInput> & { isActive?: boolean },
): Promise<AiAssistantFaq> {
  return backendPatch<
    AiAssistantFaq,
    Partial<AiAssistantFaqInput> & { isActive?: boolean }
  >("/photographers/me/ai-assistant/faqs/" + encodeURIComponent(id), patch);
}

export function deactivateAssistantFaq(id: string): Promise<AiAssistantFaq> {
  return backendDelete<AiAssistantFaq>(
    "/photographers/me/ai-assistant/faqs/" + encodeURIComponent(id),
  );
}
