import type { AdminBooking } from "@/types";

// Mock bookings for admin monitoring (escrow + collaboration). Imported ONLY by
// src/msw/handlers.ts. Prices in VND.
const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const inDays = (n: number) => daysAgo(-n);

export const mockBookings: AdminBooking[] = [
  {
    id: "bk1",
    clientName: "Nguyễn Thuý An",
    photographerName: "Lý Gia Hân",
    style: "Chân dung",
    date: inDays(5),
    price: 2_400_000,
    status: "confirmed",
  },
  {
    id: "bk2",
    clientName: "Trần Khách Hàng",
    photographerName: "Trần Quốc Bảo",
    style: "Cưới",
    date: inDays(12),
    price: 8_000_000,
    status: "held",
    collaborators: [
      { name: "Vũ Hoàng Lan", sharePct: 40, status: "accepted" },
      { name: "Nguyễn Minh Anh", sharePct: 20, status: "invited" },
    ],
  },
  {
    id: "bk3",
    clientName: "Phạm Mai Chi",
    photographerName: "Lý Gia Hân",
    style: "Phố cổ",
    date: daysAgo(3),
    price: 1_800_000,
    status: "released",
  },
  {
    id: "bk4",
    clientName: "Lê Tiến Dũng",
    photographerName: "Nguyễn Minh Anh",
    style: "Sản phẩm",
    date: daysAgo(8),
    price: 3_200_000,
    status: "released",
    collaborators: [{ name: "Trần Quốc Bảo", sharePct: 35, status: "accepted" }],
  },
  {
    id: "bk5",
    clientName: "Hoàng Thị Em",
    photographerName: "Vũ Hoàng Lan",
    style: "Kỷ yếu",
    date: inDays(2),
    price: 5_600_000,
    status: "pending",
  },
  {
    id: "bk6",
    clientName: "Nguyễn Thuý An",
    photographerName: "Trần Quốc Bảo",
    style: "Ẩm thực",
    date: daysAgo(1),
    price: 2_000_000,
    status: "cancelled",
  },
];
