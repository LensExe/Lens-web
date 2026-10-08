/** Shared primitives and response wrappers used by multiple domains. */
export type UUID = string;
export type ISODateTime = string;

export type PhotographyStyle =
  | "portrait"
  | "vintage"
  | "korean"
  | "wedding"
  | "concept"
  | "pre-wedding"
  | "beach"
  | "lifestyle"
  | "event"
  | "corporate"
  | "family"
  | "outdoor"
  | "kids"
  | "streetwear"
  | "fashion"
  | "film"
  | "maternity"
  | "commercial";

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: ISODateTime;
}

export interface ApiPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiItems<T> { items: T[] }
export interface ApiTimeRange { from: ISODateTime; to: ISODateTime }
export type ApiObject = Record<string, unknown>;
export type PageQueryDto = { limit?: number; offset?: number };
