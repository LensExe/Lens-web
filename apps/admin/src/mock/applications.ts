import { avatar, photo } from "@lens/ui";
import type { PhotographerApplication } from "@/types";

// Mock photographer applications. Imported ONLY by the service layer.
const av = (seed: string) => avatar(seed);

// Portfolio shots are the portal app's /public/photos files (not copied into
// admin), so they're addressed through the portal's public URL.
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "http://localhost:5174";
const GENRE: Record<string, string> = {
  "Chân dung": "portrait",
  "Thời trang": "fashion",
  "Cưới": "wedding",
  "Gia đình": "family",
  "Du lịch": "travel",
  "Đường phố": "street",
  "Ẩm thực": "food",
  "Sản phẩm": "product",
  "Sự kiện": "event",
  "Kiến trúc": "architecture",
};
const portfolioOf = (seed: string, styles: string[], count: number) =>
  Array.from(
    { length: count },
    (_, i) => PORTAL_URL + photo(`${seed}-${i}`, 600, 800, GENRE[styles[i % styles.length]])
  );
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();
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
    experienceYears: 2,
    pricePerSession: 180_000,
    portfolio: portfolioOf("ap1", ["Chân dung", "Thời trang"], 14),
    bio: "Thích chụp chân dung và thời trang, đang luyện tay nghề ở Hà Nội.",
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
    experienceYears: 3,
    pricePerSession: 300_000,
    portfolio: portfolioOf("ap2", ["Cưới", "Gia đình"], 16),
    bio: "Mê ảnh cưới phóng sự, mới chụp vài buổi cho bạn bè và người thân.",
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
    experienceYears: 2,
    pricePerSession: 120_000,
    portfolio: portfolioOf("ap3", ["Du lịch", "Đường phố"], 15),
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
    experienceYears: 3,
    pricePerSession: 200_000,
    portfolio: portfolioOf("ap4", ["Ẩm thực", "Sản phẩm"], 13),
    bio: "Thích bày món và chụp ẩm thực, sản phẩm cho quán nhỏ.",
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
    experienceYears: 3,
    pricePerSession: 190_000,
    portfolio: portfolioOf("ap5", ["Sự kiện", "Kiến trúc"], 17),
    bio: "Thích chụp sự kiện và kiến trúc, giao ảnh nhanh.",
    submittedAt: daysAgo(8),
    status: "approved",
    reviewNote: "Portfolio sự kiện ổn định, ánh sáng tốt.",
    reviewedAt: hoursAgo(24 * 6),
  },
  {
    id: "ap6",
    name: "Cao Mỹ Linh",
    avatar: av("mylinh-av"),
    email: "mylinh@example.com",
    city: "Đà Lạt",
    styles: ["Chân dung", "Du lịch"],
    experienceYears: 1,
    pricePerSession: 100_000,
    portfolio: portfolioOf("ap6", ["Chân dung", "Du lịch"], 7),
    bio: "Mới vào nghề, hồ sơ còn ít tác phẩm.",
    submittedAt: daysAgo(11),
    status: "rejected",
    reviewNote: "Portfolio mới có 7 ảnh, cần tối thiểu 12 ảnh đã qua hậu kỳ. Bạn có thể gửi lại hồ sơ.",
    reviewedAt: hoursAgo(24 * 9),
  },
];
