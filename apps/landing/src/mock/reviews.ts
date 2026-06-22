import { avatar } from "@lens/ui";
import type { Review } from "@/types";

const img = (seed: string) => avatar(seed);

// Mock reviews. Imported ONLY by the service layer.
export const mockReviews: Review[] = [
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
