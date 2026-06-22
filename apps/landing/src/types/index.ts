// Shared domain types for the Lens marketplace (UI-only phase).

export type PhotoStyle =
  | "Chân dung"
  | "Cưới"
  | "Sự kiện"
  | "Thời trang"
  | "Sản phẩm"
  | "Gia đình"
  | "Du lịch"
  | "Ẩm thực"
  | "Kiến trúc"
  | "Đường phố";

export interface Photographer {
  id: string;
  name: string;
  avatar: string;
  cover: string;
  city: string;
  styles: PhotoStyle[];
  /** Giá khởi điểm cho một buổi chụp (VND). */
  pricePerSession: number;
  rating: number;
  reviewCount: number;
  bio: string;
  /** Số năm kinh nghiệm. */
  experienceYears: number;
  featured: boolean;
  portfolio: string[];
}

export type UserRole = "client" | "photographer" | "admin";

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: UserRole;
  city: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  photographerId: string;
  photographerName: string;
  style: PhotoStyle;
  /** ISO date string. */
  date: string;
  location: string;
  price: number;
  status: BookingStatus;
}

export interface Review {
  id: string;
  photographerId: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  /** ISO date string. */
  date: string;
}
