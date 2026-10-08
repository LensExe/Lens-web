import type { ApiObject, UUID } from "./common";

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

export interface ApiPortfolio {
  id: UUID;
  photographer_id: UUID;
  name: string;
  items?: UUID[] | ApiObject[];
  [key: string]: unknown;
}
