import { avatar } from "@lens/ui";
import type { UserProfile } from "@/types";

// Account profiles for the demo users (DB seed), keyed by user id. Imported ONLY
// by src/msw/handlers.ts. Ids/names match the demo session users.
export const seedProfiles: Record<string, UserProfile> = {
  "u-khachhang": {
    id: "u-khachhang",
    name: "Trần Khách Hàng",
    email: "khachhang@lens.vn",
    avatar: avatar("client-av"),
    phone: "0901234567",
    birthday: "2003-05-14",
    gender: "female",
    city: "Hà Nội",
    addressDetail: "12 Tràng Tiền, Hoàn Kiếm",
    notifications: { bookingUpdates: true, messages: true, promotions: false, emailDigest: true },
  },
  me: {
    id: "me",
    name: "Lý Gia Hân",
    email: "nhiepanhgia@lens.vn",
    avatar: avatar("giahan-av"),
    phone: "0987654321",
    birthday: "1998-11-02",
    gender: "female",
    city: "Hà Nội",
    addressDetail: "Studio 24, Tây Hồ",
    notifications: { bookingUpdates: true, messages: true, promotions: true, emailDigest: false },
  },
};
