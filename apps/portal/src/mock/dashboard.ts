import { photo as img } from "@lens/ui";
import type { Photographer } from "@/types";

// Profile of the SIGNED-IN photographer demo account (see lib/session.ts):
// Lý Gia Hân, id "me". She is also pulled into the public roster
// (mock/photographers.ts) so the signed-in photographer is a real, browsable
// account. Her incoming booking requests are NOT here — they live in the single
// bookings table (mock/bookings.ts), queried by photographerId === "me".

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
  // Computed by the mock backend from her work schedule (mock/schedules.ts).
  availableDates: [],
  // Her own service packages (editable in the dashboard).
  packages: [
    {
      id: "basic",
      name: "Gói cơ bản",
      description: "Chụp chân dung ngoài trời, ánh sáng tự nhiên.",
      price: 220_000,
      photoCount: 15,
      durationHours: 1,
      deliveryDays: 5,
    },
    {
      id: "standard",
      name: "Gói tiêu chuẩn",
      description: "2 bộ trang phục, 2 bối cảnh, hỗ trợ tạo dáng.",
      price: 400_000,
      photoCount: 35,
      durationHours: 2,
      deliveryDays: 7,
    },
    {
      id: "premium",
      name: "Gói cao cấp",
      description: "Nửa ngày chụp gia đình, kèm 1 album in 20×30.",
      price: 660_000,
      photoCount: 70,
      durationHours: 4,
      deliveryDays: 10,
    },
  ],
};

// Payouts from shoots before the bookings table existed, for the earnings chart:
// the 6 months up to and including the current one (oldest → newest). Live
// released bookings are added on top by the mock backend.
export const seedMonthlyEarnings = [1_620_000, 2_180_000, 1_940_000, 2_760_000, 3_120_000, 2_050_000];
