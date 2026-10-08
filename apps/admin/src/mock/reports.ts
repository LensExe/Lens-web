import { avatar } from "@lens/ui";
import type { ReportData } from "@/types";

// Mock analytics for the reports screen. Imported ONLY by src/msw/handlers.ts.
// The 6 months end with the current one ("Th9" in September).
const monthLabel = (monthsAgo: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  return `Th${d.getMonth() + 1}`;
};

export const mockReports: ReportData = {
  monthly: [
    { month: monthLabel(5), bookings: 18, revenue: 7_200_000 },
    { month: monthLabel(4), bookings: 27, revenue: 11_000_000 },
    { month: monthLabel(3), bookings: 41, revenue: 16_400_000 },
    { month: monthLabel(2), bookings: 58, revenue: 23_500_000 },
    { month: monthLabel(1), bookings: 76, revenue: 31_000_000 },
    { month: monthLabel(0), bookings: 94, revenue: 39_000_000 },
  ],
  byStyle: [
    { label: "Cưới", count: 72 },
    { label: "Chân dung", count: 61 },
    { label: "Gia đình", count: 47 },
    { label: "Sự kiện", count: 41 },
    { label: "Thời trang", count: 31 },
    { label: "Du lịch", count: 26 },
    { label: "Ẩm thực", count: 21 },
    { label: "Sản phẩm", count: 15 },
    { label: "Kiến trúc", count: 13 },
    { label: "Đường phố", count: 9 },
  ],
  byCity: [
    { label: "TP. Hồ Chí Minh", count: 109 },
    { label: "Hà Nội", count: 92 },
    { label: "Đà Nẵng", count: 47 },
    { label: "Đà Lạt", count: 35 },
    { label: "Cần Thơ", count: 20 },
    { label: "Hải Phòng", count: 11 },
  ],
  topRated: [
    {
      photographerId: "u3",
      name: "Trần Quốc Bảo",
      avatar: avatar("quocbao-rating"),
      rating: 4.98,
      reviewCount: 86,
      completedSessions: 132,
    },
    {
      photographerId: "u2",
      name: "Nguyễn Minh Anh",
      avatar: avatar("minhanh-rating"),
      rating: 4.95,
      reviewCount: 64,
      completedSessions: 68,
    },
    {
      photographerId: "u1",
      name: "Lý Gia Hân",
      avatar: avatar("giahan-rating"),
      rating: 4.92,
      reviewCount: 38,
      completedSessions: 27,
    },
    {
      photographerId: "u14",
      name: "Đỗ Khánh Vy",
      avatar: avatar("khanhvy-rating"),
      rating: 4.88,
      reviewCount: 31,
      completedSessions: 11,
    },
    {
      photographerId: "u13",
      name: "Vũ Hoàng Lan",
      avatar: avatar("hoanglan-rating"),
      rating: 4.86,
      reviewCount: 27,
      completedSessions: 14,
    },
  ],
};
