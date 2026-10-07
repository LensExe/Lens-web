export type PhotographyStyle =
  | "portrait" | "vintage" | "korean" | "wedding" | "concept" | "pre-wedding"
  | "beach" | "lifestyle" | "event" | "corporate" | "family" | "outdoor"
  | "kids" | "streetwear" | "fashion" | "film" | "maternity" | "commercial";

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiItems<T> { items: T[] }

export interface PhotographerSearchQueryDto {
  limit?: number;
  offset?: number;
  location?: string;
  keyword?: string;
  min_rating?: number;
}

export interface ApiPhotographer {
  id: string;
  fullname: string;
  avatar_url: string | null;
  styles: PhotographyStyle[];
  started_career_at: number | null;
  is_verified: boolean;
  verification_status: string;
  location: string;
  is_available: boolean;
  description: string;
  rating?: {
    average_rating: number;
    total_feedbacks: number;
    total_bookings: number;
    return_customers: number;
  };
  rank?: { code: string; name: string };
  badges?: Array<{ code: string; name: string; earned_at: string }>;
  [key: string]: unknown;
}
