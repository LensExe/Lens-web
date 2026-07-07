import { photo as img } from "@lens/ui";
import type { Photographer } from "@/types";

// Profile of the SIGNED-IN photographer demo account (see lib/session.ts):
// Lý Gia Hân, id "me". She is also pulled into the public roster
// (mock/photographers.ts) so the signed-in photographer is a real, browsable
// account. Her incoming booking requests are NOT here — they live in the single
// bookings table (mock/bookings.ts), queried by photographerId === "me".

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
  cover: img("giahan-cover", 1200, 600, "portrait"),
  city: "Hà Nội",
  styles: ["Chân dung", "Gia đình"],
  pricePerSession: 220_000,
  rating: 4.9,
  reviewCount: 96,
  bio: "Nhiếp ảnh gia chân dung và gia đình tại Hà Nội. Tôi yêu ánh sáng tự nhiên và những khoảnh khắc đời thường, chân thật. Mỗi buổi chụp là một câu chuyện riêng của bạn.",
  experienceYears: 7,
  featured: true,
  portfolio: [
    img("giahan-1", 600, 800, "portrait"),
    img("giahan-2", 600, 600, "family"),
    img("giahan-3", 600, 800, "portrait"),
    img("giahan-4", 600, 600, "family"),
    img("giahan-5", 600, 800, "portrait"),
    img("giahan-6", 600, 600, "family"),
    img("giahan-7", 600, 800, "portrait"),
    img("giahan-8", 600, 600, "family"),
  ],
  // Days she has marked herself free. Seeded by toggling availability later.
  availableDates: [iso(2), iso(3), iso(6), iso(9), iso(13), iso(16), iso(20), iso(27)],
  // Her own service packages (editable in the dashboard).
  packages: [
    { id: "basic", name: "Gói cơ bản", duration: "1 giờ chụp · 15 ảnh chỉnh sửa", price: 220_000 },
    { id: "standard", name: "Gói tiêu chuẩn", duration: "2 giờ chụp · 35 ảnh chỉnh sửa", price: 400_000 },
    { id: "premium", name: "Gói cao cấp", duration: "Nửa ngày · 70 ảnh + 1 album", price: 660_000 },
  ],
};
