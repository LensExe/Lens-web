import type { ISODateTime, UUID } from "./common";

/** Current-user profile DTOs and response types. */
export interface UpdateMyIdentityDto {
  fullname?: string;
  avatar_url?: string;
  phone_number?: string;
  gender?: "male" | "female" | "other";
  dob?: string;
}

export interface ApiUser {
  id: UUID;
  keycloak_id: string;
  fullname: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  gender?: "male" | "female" | "other" | null;
  dob?: string | null;
  status: "active" | "inactive" | "suspended" | "banned";
  created_at: ISODateTime;
  updated_at: ISODateTime;
  [key: string]: unknown;
}

export interface ApiPublicUser {
  id: UUID;
  fullname: string;
  avatar_url: string | null;
}
