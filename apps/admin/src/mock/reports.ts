import type { ReportData } from "@/types";

// Mock analytics for the reports screen. Imported ONLY by the service layer.
export const mockReports: ReportData = {
  monthly: [
    { month: "T1", bookings: 248, revenue: 392_000_000 },
    { month: "T2", bookings: 212, revenue: 338_000_000 },
    { month: "T3", bookings: 301, revenue: 471_000_000 },
    { month: "T4", bookings: 356, revenue: 558_000_000 },
    { month: "T5", bookings: 389, revenue: 612_000_000 },
    { month: "T6", bookings: 412, revenue: 486_000_000 },
  ],
  byStyle: [
    { label: "Cưới", count: 842 },
    { label: "Chân dung", count: 731 },
    { label: "Gia đình", count: 564 },
    { label: "Sự kiện", count: 489 },
    { label: "Thời trang", count: 376 },
    { label: "Du lịch", count: 312 },
    { label: "Ẩm thực", count: 248 },
    { label: "Sản phẩm", count: 180 },
  ],
  byCity: [
    { label: "TP. Hồ Chí Minh", count: 1284 },
    { label: "Hà Nội", count: 1102 },
    { label: "Đà Nẵng", count: 567 },
    { label: "Đà Lạt", count: 421 },
    { label: "Cần Thơ", count: 238 },
    { label: "Hải Phòng", count: 130 },
  ],
};
