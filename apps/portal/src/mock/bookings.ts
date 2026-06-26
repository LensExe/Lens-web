import type { Booking } from "@/types";

// Mock bookings for the signed-in client. Imported ONLY by the service layer.
const iso = (daysFromNow: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const seedBookings: Booking[] = [
  {
    id: "bk-seed-1",
    clientId: "me",
    clientName: "Lý Gia Hân",
    photographerId: "p2",
    photographerName: "Trần Quốc Bảo",
    style: "Cưới",
    date: iso(10),
    location: "Hồ Gươm, Hà Nội",
    price: 800_000,
    status: "confirmed",
  },
  {
    id: "bk-seed-2",
    clientId: "me",
    clientName: "Lý Gia Hân",
    photographerId: "p3",
    photographerName: "Lê Thị Hương",
    style: "Du lịch",
    date: iso(21),
    location: "Bà Nà Hills, Đà Nẵng",
    price: 200_000,
    status: "pending",
  },
  {
    id: "bk-seed-3",
    clientId: "me",
    clientName: "Lý Gia Hân",
    photographerId: "p1",
    photographerName: "Nguyễn Minh Anh",
    style: "Chân dung",
    date: iso(-14),
    location: "Phố cổ, Hà Nội",
    price: 300_000,
    status: "completed",
  },
  {
    id: "bk-seed-4",
    clientId: "me",
    clientName: "Lý Gia Hân",
    photographerId: "p4",
    photographerName: "Phạm Đức Duy",
    style: "Ẩm thực",
    date: iso(-32),
    location: "Quận 1, TP. Hồ Chí Minh",
    price: 400_000,
    status: "cancelled",
  },
];
