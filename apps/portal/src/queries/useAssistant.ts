import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssistantFaq,
  deactivateAssistantFaq,
  getAssistantFaqs,
  getAssistantConfig,
  getAssistantReplySuggestions,
  updateAssistantFaq,
  updateAssistantConfig,
} from "@/services/assistant";
import type { AiAssistantFaqInput, AiAssistantSettings } from "@/types";

// Layer 2 — Query hooks.
export const assistantKeys = {
  config: ["assistant", "config"] as const,
  faqs: ["assistant", "faqs"] as const,
  suggestions: ["assistant", "suggestions"] as const,
};

export function useAssistantConfig() {
  return useQuery({
    queryKey: assistantKeys.config,
    queryFn: getAssistantConfig,
  });
}

export function useAssistantReplySuggestions() {
  return useQuery({
    queryKey: assistantKeys.suggestions,
    queryFn: getAssistantReplySuggestions,
  });
}

export function useAssistantFaqs() {
  return useQuery({
    queryKey: assistantKeys.faqs,
    queryFn: getAssistantFaqs,
  });
}

export function useCreateAssistantFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssistantFaq,
    onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.faqs }),
  });
}

export function useUpdateAssistantFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<AiAssistantFaqInput> & { isActive?: boolean };
    }) => updateAssistantFaq(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.faqs }),
  });
}

export function useDeactivateAssistantFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateAssistantFaq,
    onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.faqs }),
  });
}

export function useUpdateAssistantConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AiAssistantSettings>) =>
      updateAssistantConfig(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.config });
    },
  });
}
