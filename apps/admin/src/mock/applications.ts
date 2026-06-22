import { avatar } from "@lens/ui";
import type { PhotographerApplication } from "@/types";

// Mock photographer applications. Imported ONLY by the service layer.
const av = (seed: string) => avatar(seed);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const mockApplications: PhotographerApplication[] = [
  {
    id: "ap1",
    name: "Mai Tuấn Khải",
    avatar: av("tuankhai-av"),
    email: "tuankhai@example.com",
    city: "Hà Nội",
    styles: ["Chân dung", "Thời trang"],
    experienceYears: 4,
    pricePerSession: 2_800_000,
    portfolioCount: 18,
    bio: "Chuyên chân dung studio và thời trang, tốt nghiệp nhiếp ảnh tại Hà Nội.",
    submittedAt: daysAgo(1),
    status: "pending",
  },
  {
    id: "ap2",
    name: "Lâm Tố Như",
    avatar: av("tonhu-av"),
    email: "tonhu@example.com",
    city: "TP. Hồ Chí Minh",
    styles: ["Cưới", "Gia đình"],
    experienceYears: 6,
    pricePerSession: 5_500_000,
    portfolioCount: 32,
    bio: "Ảnh cưới phóng sự, đã thực hiện hơn 120 bộ ảnh cưới.",
    submittedAt: daysAgo(2),
    status: "pending",
  },
  {
    id: "ap3",
    name: "Huỳnh Bá Lộc",
    avatar: av("baloc-av"),
    email: "baloc@example.com",
    city: "Đà Nẵng",
    styles: ["Du lịch", "Đường phố"],
    experienceYears: 3,
    pricePerSession: 1_900_000,
    portfolioCount: 24,
    bio: "Săn ảnh du lịch khắp miền Trung, phong cách tự nhiên.",
    submittedAt: daysAgo(3),
    status: "pending",
  },
  {
    id: "ap4",
    name: "Đinh Phương Thảo",
    avatar: av("phuongthao-av"),
    email: "phuongthao@example.com",
    city: "Hà Nội",
    styles: ["Ẩm thực", "Sản phẩm"],
    experienceYears: 5,
    pricePerSession: 3_200_000,
    portfolioCount: 27,
    bio: "Food stylist kiêm nhiếp ảnh gia, cộng tác nhiều thương hiệu F&B.",
    submittedAt: daysAgo(5),
    status: "pending",
  },
  {
    id: "ap5",
    name: "Trương Gia Bảo",
    avatar: av("giabao-av"),
    email: "giabao@example.com",
    city: "Cần Thơ",
    styles: ["Sự kiện", "Kiến trúc"],
    experienceYears: 7,
    pricePerSession: 3_000_000,
    portfolioCount: 41,
    bio: "Chụp sự kiện doanh nghiệp và kiến trúc, giao ảnh nhanh.",
    submittedAt: daysAgo(8),
    status: "approved",
  },
  {
    id: "ap6",
    name: "Cao Mỹ Linh",
    avatar: av("mylinh-av"),
    email: "mylinh@example.com",
    city: "Đà Lạt",
    styles: ["Chân dung", "Du lịch"],
    experienceYears: 2,
    pricePerSession: 1_500_000,
    portfolioCount: 9,
    bio: "Mới vào nghề, hồ sơ còn ít tác phẩm.",
    submittedAt: daysAgo(11),
    status: "rejected",
  },
];
