import type { ActivityItem } from "@/types";

// Mock headline numbers + activity feed. Imported ONLY by src/msw/handlers.ts.
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

// Platform totals now and at the end of last month (the handler derives the
// % change; revenue comes from the monthly report series).
export const mockStats = {
  totalUsers: 482,
  totalPhotographers: 38,
  totalBookings: 314,
  lastMonth: { totalUsers: 441, totalPhotographers: 35, totalBookings: 268 },
};

export const mockActivity: ActivityItem[] = [
  { id: "a1", type: "application", text: "Mai Tuấn Khải gửi hồ sơ nhiếp ảnh gia mới", at: minsAgo(12) },
  { id: "a2", type: "booking", text: "Nguyễn Thuý An đặt lịch chụp chân dung với Lý Gia Hân", at: minsAgo(48) },
  { id: "a3", type: "signup", text: "Đỗ Thu Giang vừa tạo tài khoản khách hàng", at: minsAgo(95) },
  { id: "a7", type: "withdrawal", text: "Lý Gia Hân yêu cầu rút 3.200.000 ₫ về ngân hàng", at: minsAgo(60 * 5 - 20) },
  { id: "a4", type: "report", text: "Báo cáo vi phạm nội dung từ một khách hàng", at: minsAgo(160) },
  { id: "a5", type: "application", text: "Lâm Tố Như gửi hồ sơ nhiếp ảnh gia mới", at: minsAgo(60 * 5) },
  { id: "a6", type: "booking", text: "Lê Tiến Dũng đặt lịch chụp gia đình tại Bát Tràng", at: minsAgo(60 * 9) },
];
