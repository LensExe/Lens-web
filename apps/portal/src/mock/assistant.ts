import type { AssistantConfig } from "@/types";

// Seed AI-assistant context for the signed-in photographer "me". Imported ONLY by
// src/msw/handlers.ts.
export const seedAssistantConfig: AssistantConfig = {
  photographerId: "me",
  services:
    "Gói cơ bản 450k (1h, 15 ảnh), Tiêu chuẩn 800k (2h, 35 ảnh), Cao cấp 1.35tr (nửa ngày, 70 ảnh + album).",
  style: "Chân dung & gia đình, ánh sáng tự nhiên, cảm xúc chân thật.",
  area: "Hà Nội và khu vực lân cận",
  faqs: [
    {
      q: "Bao lâu thì giao ảnh?",
      a: "Mình giao ảnh trong vòng 5–7 ngày sau buổi chụp nhé.",
    },
    {
      q: "Có hỗ trợ trang điểm không?",
      a: "Mình có thể kết nối makeup artist, chi phí tính riêng theo nhu cầu.",
    },
    {
      q: "Thanh toán và đặt cọc thế nào?",
      a: "Bạn thanh toán qua sàn Lens; tiền được giữ đến khi bạn xác nhận đã nhận đủ ảnh.",
    },
  ],
  tone: "Thân thiện, ngắn gọn",
  enabled: true,
};
