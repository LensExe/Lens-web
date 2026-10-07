import type { AssistantConfig, Conversation } from "@/types";

const unsupported = () => new Error("lens-backend chưa cung cấp API trợ lý AI.");

export async function getAssistantConfig(): Promise<AssistantConfig> { throw unsupported(); }
export async function updateAssistantConfig(patch: Partial<AssistantConfig>): Promise<AssistantConfig> { void patch; throw unsupported(); }
export async function toggleConversationAI(conversationId: string, enabled: boolean): Promise<Conversation> { void conversationId; void enabled; throw unsupported(); }
