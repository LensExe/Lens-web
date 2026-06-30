import type { Booking } from "@/types";

// The single mock "bookings table" — the one source of truth the mock backend
// (src/msw/handlers.ts) reads. A booking links a CLIENT (clientId) to a
// PHOTOGRAPHER (photographerId). The same row is seen from two sides:
//   • client  → GET /api/bookings      (rows where clientId === me)
//   • NAG      → GET /api/me/bookings   (rows where photographerId === me)
// Demo accounts (see lib/session.ts): client "u-khachhang" (Trần Khách Hàng)
// and photographer "me" (Lý Gia Hân). Clients c-* and photographers p* are
// other people in the system that you can't log in as.
const iso = (daysFromNow: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const seedBookings: Booking[] = [
  // ── Trần Khách Hàng (u-khachhang) as a CLIENT, booking photographers ───────
  {
    id: "bk-tkh-1",
    clientId: "u-khachhang",
    clientName: "Trần Khách Hàng",
    photographerId: "p2",
    photographerName: "Trần Quốc Bảo",
    style: "Cưới",
    date: iso(10),
    location: "Hồ Gươm, Hà Nội",
    price: 800_000,
    status: "confirmed",
  },
  {
    id: "bk-tkh-2",
    clientId: "u-khachhang",
    clientName: "Trần Khách Hàng",
    photographerId: "p3",
    photographerName: "Lê Thị Hương",
    style: "Du lịch",
    date: iso(21),
    location: "Bà Nà Hills, Đà Nẵng",
    price: 200_000,
    status: "pending",
  },
  {
    id: "bk-tkh-3",
    clientId: "u-khachhang",
    clientName: "Trần Khách Hàng",
    photographerId: "p6",
    photographerName: "Đặng Gia Khang",
    style: "Sự kiện",
    date: iso(-2),
    location: "Quận 3, TP. Hồ Chí Minh",
    price: 600_000,
    status: "held",
  },
  {
    id: "bk-tkh-4",
    clientId: "u-khachhang",
    clientName: "Trần Khách Hàng",
    photographerId: "p1",
    photographerName: "Nguyễn Minh Anh",
    style: "Chân dung",
    date: iso(-14),
    location: "Phố cổ, Hà Nội",
    price: 300_000,
    status: "released",
  },
  {
    id: "bk-tkh-5",
    clientId: "u-khachhang",
    clientName: "Trần Khách Hàng",
    photographerId: "p4",
    photographerName: "Phạm Đức Duy",
    style: "Ẩm thực",
    date: iso(-32),
    location: "Quận 1, TP. Hồ Chí Minh",
    price: 400_000,
    status: "cancelled",
  },
  // Cross-link: Trần Khách Hàng books the signed-in photographer (Lý Gia Hân),
  // so this same row shows in her client list AND in Lý Gia Hân's requests.
  {
    id: "bk-tkh-giahan",
    clientId: "u-khachhang",
    clientName: "Trần Khách Hàng",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Gia đình",
    date: iso(8),
    location: "Hồ Tây, Hà Nội",
    price: 450_000,
    status: "pending",
  },

  // ── Other clients booking Lý Gia Hân (me) — her incoming requests ──────────
  {
    id: "in-1",
    clientId: "c-anh",
    clientName: "Nguyễn Thuý An",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Chân dung",
    date: iso(4),
    location: "Hồ Tây, Hà Nội",
    price: 450_000,
    status: "pending",
  },
  {
    id: "in-2",
    clientId: "c-binh",
    clientName: "Trần Văn Bình",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Gia đình",
    date: iso(7),
    location: "Công viên Thống Nhất, Hà Nội",
    price: 550_000,
    status: "pending",
  },
  {
    id: "in-3",
    clientId: "c-chi",
    clientName: "Phạm Mai Chi",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Chân dung",
    date: iso(12),
    location: "Phố cổ, Hà Nội",
    price: 450_000,
    status: "confirmed",
  },
  {
    id: "in-4",
    clientId: "c-dung",
    clientName: "Lê Tiến Dũng",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Gia đình",
    date: iso(18),
    location: "Bát Tràng, Hà Nội",
    price: 650_000,
    status: "confirmed",
  },
  {
    id: "in-5",
    clientId: "c-em",
    clientName: "Hoàng Thị Em",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Chân dung",
    date: iso(-9),
    location: "Hoàng thành Thăng Long, Hà Nội",
    price: 450_000,
    status: "released",
  },
  {
    id: "in-6",
    clientId: "c-phong",
    clientName: "Vũ Hồng Phong",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Gia đình",
    date: iso(-23),
    location: "Cầu Long Biên, Hà Nội",
    price: 550_000,
    status: "held",
  },
  {
    id: "in-7",
    clientId: "c-giang",
    clientName: "Đỗ Thu Giang",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Chân dung",
    date: iso(-3),
    location: "Vườn hoa Lý Thái Tổ, Hà Nội",
    price: 450_000,
    status: "cancelled",
  },
];
