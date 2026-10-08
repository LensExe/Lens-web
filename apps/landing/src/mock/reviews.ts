import { avatar } from "@lens/ui";
import type { Review } from "@/types";
import { mockPhotographers } from "@/mock/photographers";

const img = (seed: string) => avatar(seed);

// Mock reviews. Imported ONLY by the service layer.
const curatedReviews: Review[] = [
  {
    id: "r1",
    photographerId: "p1",
    authorName: "Lý Gia Hân",
    authorAvatar: img("giahan-rv"),
    rating: 5,
    comment: "Ảnh đẹp tự nhiên, anh chụp rất có tâm và hướng dẫn tạo dáng tận tình.",
    date: "2026-05-12",
  },
  {
    id: "r2",
    photographerId: "p2",
    authorName: "Trương Văn Phúc",
    authorAvatar: img("vanphuc-rv"),
    rating: 5,
    comment: "Bộ ảnh cưới vượt mong đợi, cảm xúc và chuyên nghiệp từ đầu đến cuối.",
    date: "2026-04-30",
  },
  {
    id: "r3",
    photographerId: "p7",
    authorName: "Đỗ Khánh Vy",
    authorAvatar: img("khanhvy-rv"),
    rating: 5,
    comment: "Chụp ở Đà Lạt cực kỳ lãng mạn, màu phim nhẹ nhàng đúng gu mình.",
    date: "2026-03-18",
  },
  {
    id: "r4",
    photographerId: "p3",
    authorName: "Trần Quốc Bảo",
    authorAvatar: img("quocbao-rv"),
    rating: 4,
    comment: "Phong cách đường phố ấn tượng, giao ảnh đúng hẹn.",
    date: "2026-02-25",
  },
];

const REVIEWERS = ["Nguyễn Mai Phương", "Phạm Thu Hà", "Đặng Mỹ Linh", "Bùi Quang Huy"];
const COMMENTS = [
  "Buổi chụp thoải mái, ảnh đẹp và giao đúng hẹn. Mình rất hài lòng.",
  "Tư vấn góc chụp tận tình, màu ảnh đúng phong cách mình yêu thích.",
  "Chuyên nghiệp từ lúc trao đổi đến khi nhận ảnh, chắc chắn sẽ quay lại.",
  "Bắt được nhiều khoảnh khắc tự nhiên, bộ ảnh đẹp hơn mong đợi.",
];

// Every photographer has at least one review so profile/detail states never
// fall into an accidental empty state. Curated reviews above keep the landing
// page's original testimonials; the rest are deterministic fallback rows.
const coveredIds = new Set(curatedReviews.map((review) => review.photographerId));
export const mockReviews: Review[] = [
  ...curatedReviews,
  ...mockPhotographers
    .filter((photographer) => !coveredIds.has(photographer.id))
    .map((photographer, index) => ({
      id: `${photographer.id}-r1`,
      photographerId: photographer.id,
      authorName: REVIEWERS[index % REVIEWERS.length],
      authorAvatar: img(`landing-reviewer-${index}`),
      rating: index % 4 === 0 ? 4 : 5,
      comment: COMMENTS[index % COMMENTS.length],
      date: `2026-0${Math.min(9, (index % 8) + 2)}-${String((index % 20) + 1).padStart(2, "0")}`,
    })),
];
