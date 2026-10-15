import type { UUID } from "./common";

/** Portfolio and portfolio-item DTOs. */
export interface PortfolioCreateDto {
  name: string;
  category?: string;
  description?: string;
  cover_media_id?: UUID;
}

export type PortfolioUpdateDto = Partial<PortfolioCreateDto>;
export interface PortfolioAddItemDto { media_id: UUID }
export interface PortfolioReorderDto { portfolio_item_ids: UUID[] }

export interface ApiPortfolioItem {
  id: UUID;
  portfolio_id: UUID;
  media_id: UUID;
  position: number;
  preview_url?: string;
  download_url: string;
}

export interface ApiPortfolio {
  id: UUID;
  photographer_id: UUID;
  name: string;
  cover_media_id?: UUID | null;
  cover_url?: string | null;
  expires_in?: number;
  items?: Array<UUID | ApiPortfolioItem>;
  [key: string]: unknown;
}
