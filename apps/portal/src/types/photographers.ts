import type { PageQueryDto, PhotographyStyle, UUID } from "./common";

/** Photographer search, profile, and availability DTOs. */
export interface PhotographerSearchQueryDto extends PageQueryDto {
  location?: string;
  keyword?: string;
  min_rating?: number;
}

export interface PhotographerLocationDto { location: string }
export interface PhotographerStatusDto { is_available: boolean }

export interface PhotographerCreateDto {
  tax_code?: string;
  styles: PhotographyStyle[];
  started_career_at?: number;
  location: string;
  description?: string;
}

export interface PhotographerUpdateDto {
  tax_code?: string;
  styles?: PhotographyStyle[];
  started_career_at?: number;
  description?: string;
}

export interface PhotographerRejectDto { reason: string }

export interface ApiPhotographer {
  id: UUID;
  user_id?: UUID;
  fullname?: string;
  avatar_url?: string | null;
  styles: PhotographyStyle[];
  started_career_at?: number | null;
  is_verified: boolean;
  verification_status?: string;
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
