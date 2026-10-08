import type { ISODateTime, PhotographyStyle, UUID } from "./common";

/** Customer profile DTOs and response types. */
export interface CustomerUpdateDto {
  description?: string | null;
  preferred_styles?: PhotographyStyle[];
  location?: string | null;
}

export interface ApiCustomer {
  id: UUID;
  user_id: UUID;
  fullname: string;
  avatar_url: string | null;
  description?: string | null;
  preferred_styles: PhotographyStyle[];
  location?: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  [key: string]: unknown;
}

export interface CustomerBookingSummary {
  total: number;
  pending: number;
  completed: number;
  total_spent_vnd: number;
}
