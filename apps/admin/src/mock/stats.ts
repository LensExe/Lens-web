import type { ActivityItem, OverviewStats } from "@/types";

// Mock headline numbers + activity feed. Imported ONLY by the service layer.
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const mockStats: OverviewStats = {
  totalUsers: 1284,
  totalPhotographers: 156,
  totalBookings: 3742,
  monthlyRevenue: 486_000_000,
};

export const mockActivity: ActivityItem[] = [
  { id: "a1", type: "application", text: "Mai Tuấn Khải gửi hồ sơ nhiếp ảnh gia mới", at: minsAgo(12) },
  { id: "a2", type: "booking", text: "Nguyễn Thuý An đặt lịch chụp chân dung với Lý Gia Hân", at: minsAgo(48) },
  { id: "a3", type: "signup", text: "Đỗ Thu Giang vừa tạo tài khoản khách hàng", at: minsAgo(95) },
  { id: "a4", type: "report", text: "Báo cáo vi phạm nội dung từ một khách hàng", at: minsAgo(160) },
  { id: "a5", type: "application", text: "Lâm Tố Như gửi hồ sơ nhiếp ảnh gia mới", at: minsAgo(60 * 5) },
  { id: "a6", type: "booking", text: "Lê Tiến Dũng đặt lịch chụp gia đình tại Bát Tràng", at: minsAgo(60 * 9) },
];
