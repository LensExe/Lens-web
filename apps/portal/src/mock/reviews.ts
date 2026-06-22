import { avatar } from "@lens/ui";
import type { Review } from "@/types";
import { mockPhotographers } from "./photographers";

// Mock reviews (Vietnamese). Imported ONLY by the service layer.
const img = (seed: string) => avatar(seed);

const REVIEWERS = [
  "Phạm Thu Hà",
  "Ngô Bảo Long",
  "Đặng Mỹ Linh",
  "Bùi Quang Huy",
  "Vũ Khánh Vy",
  "Hoàng Anh Tuấn",
  "Lý Thảo Nhi",
  "Trịnh Văn Nam",
  "Đỗ Phương Anh",
  "Cao Minh Đức",
];

const COMMENTS = [
  "Buổi chụp rất thoải mái, ảnh ra đẹp hơn mong đợi. Sẽ quay lại lần sau!",
  "Anh/chị chụp có tâm, chỉnh sửa kỹ và giao ảnh đúng hẹn. Rất hài lòng.",
  "Tư vấn góc chụp và trang phục rất nhiệt tình, kết quả ưng ý lắm.",
  "Ảnh tự nhiên, màu đẹp, không bị gượng. Mình giới thiệu cho bạn bè luôn.",
  "Chuyên nghiệp từ khâu liên hệ đến lúc nhận ảnh. Đáng đồng tiền.",
  "Rất kiên nhẫn với bé nhà mình, bắt được nhiều khoảnh khắc dễ thương.",
  "Chất lượng ảnh tốt, bố cục chắc tay. Chỉ tiếc là hơi ít ảnh hậu trường.",
  "Đúng phong cách mình thích, nhẹ nhàng mà vẫn cuốn. 10 điểm!",
];

const toISODate = (daysAgo: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// 3–5 reviews per photographer, deterministic by index so every profile has
// content and ratings stay close to the photographer's overall score.
export const mockReviews: Review[] = mockPhotographers.flatMap((p, pi) => {
  const count = 3 + (pi % 3); // 3, 4 or 5
  return Array.from({ length: count }, (_, ri) => {
    const k = pi * 5 + ri;
    const rating = Math.min(5, Math.max(4, Math.round(p.rating) - (ri % 2)));
    return {
      id: `${p.id}-r${ri + 1}`,
      photographerId: p.id,
      authorName: REVIEWERS[k % REVIEWERS.length],
      authorAvatar: img(`reviewer-${k}`),
      rating,
      comment: COMMENTS[k % COMMENTS.length],
      date: toISODate((ri + 1) * 9 + (pi % 7)),
    };
  });
});
