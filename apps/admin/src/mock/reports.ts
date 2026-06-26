import type { ReportData } from "@/types";

// Mock analytics for the reports screen. Imported ONLY by the service layer.
export const mockReports: ReportData = {
  monthly: [
    { month: "T1", bookings: 18, revenue: 7_200_000 },
    { month: "T2", bookings: 27, revenue: 11_000_000 },
    { month: "T3", bookings: 41, revenue: 16_400_000 },
    { month: "T4", bookings: 58, revenue: 23_500_000 },
    { month: "T5", bookings: 76, revenue: 31_000_000 },
    { month: "T6", bookings: 94, revenue: 39_000_000 },
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
  ],
  byCity: [
    { label: "TP. Hồ Chí Minh", count: 109 },
    { label: "Hà Nội", count: 92 },
    { label: "Đà Nẵng", count: 47 },
    { label: "Đà Lạt", count: 35 },
    { label: "Cần Thơ", count: 20 },
    { label: "Hải Phòng", count: 11 },
  ],
};
