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
      a: "Bạn đặt cọc 30% để giữ lịch, phần còn lại thanh toán sau khi mình xác nhận. Tiền do sàn Lens giữ đến khi bạn nhận đủ ảnh. Huỷ trước buổi chụp từ 7 ngày được hoàn 100%, muộn hơn sẽ mất cọc.",
    },
  ],
  tone: "Thân thiện, ngắn gọn",
  enabled: true,
};

// Keep one explicitly disabled assistant in the seed as well. This lets the
// assistant settings and admin quality screens demonstrate both toggle states.
export const seedAssistantConfigs: Record<string, AssistantConfig> = {
  me: seedAssistantConfig,
  p2: {
    photographerId: "p2",
    services: "Gói ảnh cưới từ 3.2tr, nhận chụp tại TP. Hồ Chí Minh và các tỉnh lân cận.",
    style: "Ảnh cưới phóng sự, cảm xúc tự nhiên.",
    area: "TP. Hồ Chí Minh và khu vực lân cận",
    faqs: [],
    tone: "Thân thiện, ngắn gọn",
    enabled: false,
  },
};
