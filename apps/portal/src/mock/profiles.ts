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
  // Additional linked users keep the profile seed representative of the
  // booking/message fixtures, even though only the two demo accounts log in.
  "c-anh": {
    id: "c-anh",
    name: "Nguyễn Thuý An",
    email: "thuyan@lens.vn",
    avatar: avatar("thuyan-av"),
    phone: "0912345678",
    birthday: "1999-08-21",
    gender: "male",
    city: "Hà Nội",
    addressDetail: "Cầu Giấy, Hà Nội",
    notifications: { bookingUpdates: true, messages: true, promotions: false, emailDigest: false },
  },
  "c-chi": {
    id: "c-chi",
    name: "Phạm Mai Chi",
    email: "maichi@lens.vn",
    avatar: avatar("maichi-av"),
    phone: "0923456789",
    birthday: "2001-02-11",
    gender: "other",
    city: "Hà Nội",
    addressDetail: "Hoàn Kiếm, Hà Nội",
    notifications: { bookingUpdates: true, messages: false, promotions: true, emailDigest: true },
  },
  "c-em": {
    id: "c-em",
    name: "Hoàng Thị Em",
    email: "thiem@lens.vn",
    avatar: avatar("thiem-av"),
    phone: "0934567890",
    birthday: "",
    gender: "",
    city: "Đà Nẵng",
    addressDetail: "",
    notifications: { bookingUpdates: false, messages: true, promotions: false, emailDigest: false },
  },
};
