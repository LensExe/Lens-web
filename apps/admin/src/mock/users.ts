import { avatar } from "@lens/ui";
import type { AdminUser } from "@/types";

// Mock platform users. Imported ONLY by the service layer.
const av = (seed: string) => avatar(seed);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const mockUsers: AdminUser[] = [
  { id: "u1", name: "Lý Gia Hân", email: "giahan@example.com", avatar: av("giahan-av"), role: "photographer", status: "active", city: "Hà Nội", joinedAt: daysAgo(150), bookingsCount: 24 },
  { id: "u2", name: "Nguyễn Minh Anh", email: "minhanh@example.com", avatar: av("minhanh-av"), role: "photographer", status: "active", city: "Hà Nội", joinedAt: daysAgo(168), bookingsCount: 28 },
  { id: "u3", name: "Trần Quốc Bảo", email: "quocbao@example.com", avatar: av("quocbao-av"), role: "photographer", status: "active", city: "TP. Hồ Chí Minh", joinedAt: daysAgo(175), bookingsCount: 33 },
  { id: "u4", name: "Nguyễn Thuý An", email: "thuyan@example.com", avatar: av("thuyan-av"), role: "client", status: "active", city: "Hà Nội", joinedAt: daysAgo(45), bookingsCount: 3 },
  { id: "u5", name: "Phạm Mai Chi", email: "maichi@example.com", avatar: av("maichi-av"), role: "client", status: "active", city: "Hà Nội", joinedAt: daysAgo(38), bookingsCount: 2 },
  { id: "u6", name: "Lê Tiến Dũng", email: "tiendung@example.com", avatar: av("tiendung-av"), role: "client", status: "active", city: "TP. Hồ Chí Minh", joinedAt: daysAgo(30), bookingsCount: 1 },
  { id: "u7", name: "Hoàng Thị Em", email: "thiem@example.com", avatar: av("thiem-av"), role: "client", status: "active", city: "Đà Nẵng", joinedAt: daysAgo(120), bookingsCount: 5 },
  { id: "u8", name: "Vũ Hồng Phong", email: "hongphong@example.com", avatar: av("hongphong-av"), role: "client", status: "suspended", city: "Hải Phòng", joinedAt: daysAgo(95), bookingsCount: 0 },
  { id: "u9", name: "Lê Thị Hương", email: "lehuong@example.com", avatar: av("lehuong-av"), role: "photographer", status: "active", city: "Đà Nẵng", joinedAt: daysAgo(140), bookingsCount: 18 },
  { id: "u10", name: "Đỗ Thu Giang", email: "thugiang@example.com", avatar: av("thugiang-av"), role: "client", status: "active", city: "Cần Thơ", joinedAt: daysAgo(15), bookingsCount: 1 },
  { id: "u11", name: "Phạm Đức Duy", email: "ducduy@example.com", avatar: av("ducduy-av"), role: "photographer", status: "suspended", city: "Hà Nội", joinedAt: daysAgo(120), bookingsCount: 15 },
  { id: "u12", name: "Bùi Thanh Thảo", email: "thanhthao@example.com", avatar: av("thanhthao-av"), role: "photographer", status: "active", city: "Đà Lạt", joinedAt: daysAgo(160), bookingsCount: 30 },
];
