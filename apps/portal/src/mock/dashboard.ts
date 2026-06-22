import { photo as img } from "@lens/ui";
import type { Booking, Photographer } from "@/types";

// Mock data for the SIGNED-IN photographer's dashboard. Imported ONLY by the
// service layer. The logged-in user (see lib/session.ts) wears two hats: as a
// client she books others (mock/bookings.ts), and as a photographer she owns
// the profile below and receives the booking requests in `incomingBookings`.

const iso = (daysFromNow: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// The signed-in photographer's own profile (id "me" — not in the public roster).
export const myPhotographer: Photographer = {
  id: "me",
  name: "Lý Gia Hân",
  avatar: img("giahan-av", 200, 200),
  cover: img("giahan-cover", 1200, 600),
  city: "Hà Nội",
  styles: ["Chân dung", "Gia đình"],
  pricePerSession: 3_500_000,
  rating: 4.9,
  reviewCount: 96,
  bio: "Nhiếp ảnh gia chân dung và gia đình tại Hà Nội. Tôi yêu ánh sáng tự nhiên và những khoảnh khắc đời thường, chân thật. Mỗi buổi chụp là một câu chuyện riêng của bạn.",
  experienceYears: 7,
  featured: true,
  portfolio: [
    img("giahan-1", 600, 800),
    img("giahan-2", 600, 600),
    img("giahan-3", 600, 800),
    img("giahan-4", 600, 600),
    img("giahan-5", 600, 800),
    img("giahan-6", 600, 600),
    img("giahan-7", 600, 800),
    img("giahan-8", 600, 600),
  ],
  // Days she has marked herself free. Seeded by toggling availability later.
  availableDates: [iso(2), iso(3), iso(6), iso(9), iso(13), iso(16), iso(20), iso(27)],
};

// Booking requests OTHER clients have sent to her. Mix of statuses and dates so
// the dashboard, status filters, and accept/decline flow all have data.
export const incomingBookings: Booking[] = [
  {
    id: "in-1",
    clientId: "c-anh",
    clientName: "Nguyễn Thuý An",
    photographerId: "me",
    photographerName: "Lý Gia Hân",
    style: "Chân dung",
    date: iso(4),
    location: "Hồ Tây, Hà Nội",
    price: 3_500_000,
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
    price: 4_200_000,
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
    price: 3_500_000,
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
    price: 5_000_000,
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
    price: 3_500_000,
    status: "completed",
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
    price: 4_200_000,
    status: "completed",
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
    price: 3_500_000,
    status: "cancelled",
  },
];
