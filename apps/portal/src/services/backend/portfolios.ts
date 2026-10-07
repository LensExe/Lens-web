import { backendDelete, backendGet, backendPatch, backendPost } from "@/lib/backend-api";
import type { ApiItems, ApiObject, PageQueryDto } from "@/types/common";
import type {
  ApiPortfolio,
  PortfolioAddItemDto,
  PortfolioCreateDto,
  PortfolioReorderDto,
  PortfolioUpdateDto,
} from "@/types/portfolios";

export const createPortfolio = (body: PortfolioCreateDto) =>
  backendPost<ApiPortfolio, PortfolioCreateDto>("/photographers/me/portfolios", body);
export const listMyPhotographerPortfolios = (query: PageQueryDto = {}) =>
  backendGet<ApiItems<ApiPortfolio>>("/photographers/me/portfolios", query);
export const listPhotographerPortfolios = (photographerId: string, query: PageQueryDto = {}) =>
  backendGet<ApiItems<ApiPortfolio>>(`/photographers/${encodeURIComponent(photographerId)}/portfolios`, query);
export const getPortfolio = (portfolioId: string) =>
  backendGet<ApiPortfolio>(`/portfolios/${encodeURIComponent(portfolioId)}`);
export const addPortfolioItem = (portfolioId: string, body: PortfolioAddItemDto) =>
  backendPost<ApiObject, PortfolioAddItemDto>(`/portfolios/${encodeURIComponent(portfolioId)}/items`, body);
export const updatePortfolio = (portfolioId: string, body: PortfolioUpdateDto) =>
  backendPatch<ApiPortfolio, PortfolioUpdateDto>(`/portfolios/${encodeURIComponent(portfolioId)}`, body);
export const deletePortfolio = (portfolioId: string) =>
  backendDelete<{ deleted: boolean }>(`/portfolios/${encodeURIComponent(portfolioId)}`);
export const deletePortfolioItem = (portfolioId: string, portfolioItemId: string) =>
  backendDelete<{ deleted: boolean }>(`/portfolios/${encodeURIComponent(portfolioId)}/items/${encodeURIComponent(portfolioItemId)}`);
export const reorderPortfolioItems = (portfolioId: string, body: PortfolioReorderDto) =>
  backendPatch<ApiPortfolio, PortfolioReorderDto>(`/portfolios/${encodeURIComponent(portfolioId)}/items/reorder`, body);
