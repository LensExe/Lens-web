import { avatar } from "@lens/ui";
import type { User } from "@/types";

const img = (seed: string) => avatar(seed);

// Mock users across the three roles. Imported ONLY by the service layer.
export const mockUsers: User[] = [
  { id: "u1", name: "Lý Gia Hân", avatar: img("giahan-av"), email: "giahan@example.com", role: "client", city: "Hà Nội" },
  { id: "u2", name: "Trương Văn Phúc", avatar: img("vanphuc-av"), email: "vanphuc@example.com", role: "client", city: "TP. Hồ Chí Minh" },
  { id: "u3", name: "Nguyễn Minh Anh", avatar: img("minhanh-av"), email: "minhanh@example.com", role: "photographer", city: "Hà Nội" },
  { id: "u4", name: "Trần Quốc Bảo", avatar: img("quocbao-av"), email: "quocbao@example.com", role: "photographer", city: "TP. Hồ Chí Minh" },
  { id: "u5", name: "Admin Lens", avatar: img("admin-av"), email: "admin@lens.vn", role: "admin", city: "Hà Nội" },
];
