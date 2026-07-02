import type { AssistantConfig } from "@/types";

// AI assistant helpers (UI phase — canned, no real LLM). NOTE (giả định tạm):
// replaced by a real model + guardrails in Phase 2.

/** Topics the AI must NOT handle — always hand off to a human. */
export const HANDOFF_KEYWORDS = [
  "khiếu nại",
  "huỷ",
  "hủy",
  "hoàn tiền",
  "tranh chấp",
  "bồi thường",
  "khiếu kiện",
  "report",
];

export function needsHandoff(text: string): boolean {
  const t = text.toLowerCase();
  return HANDOFF_KEYWORDS.some((k) => t.includes(k));
}

export const HANDOFF_MESSAGE =
  "Vấn đề này cần nhiếp ảnh gia trực tiếp hỗ trợ. Mình đã chuyển cuộc trò chuyện cho nhiếp ảnh gia, bạn vui lòng chờ trong giây lát nhé.";

export const aiDisclaimer = (name: string) =>
  `Bạn đang trò chuyện với trợ lý AI của ${name}. Trợ lý chỉ trả lời trong phạm vi thông tin đã được cung cấp.`;

/** Canned reply within the photographer's provided context (never over-commits). */
export function generateReply(config: AssistantConfig, text: string): string {
  const t = text.toLowerCase();

  const faq = config.faqs.find((f) => {
    const words = f.q
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    return words.some((w) => t.includes(w));
  });
  if (faq) return faq.a;

  if (t.includes("giá") || t.includes("bao nhiêu") || t.includes("chi phí")) {
    return config.services || "Bạn tham khảo bảng giá dịch vụ của mình giúp nhé.";
  }
  if (t.includes("khu vực") || t.includes("ở đâu") || t.includes("địa điểm")) {
    return `Mình nhận chụp tại khu vực: ${config.area || "vui lòng hỏi thêm nhé"}.`;
  }
  if (t.includes("phong cách") || t.includes("style")) {
    return `Phong cách của mình: ${config.style || "đa dạng theo yêu cầu"}.`;
  }
  return `Cảm ơn bạn đã nhắn tin! Mình sẽ phản hồi chi tiết sớm. Tham khảo thêm: ${
    config.services || "các gói dịch vụ của mình"
  }.`;
}
