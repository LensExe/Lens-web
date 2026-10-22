import { portfolioApi } from "@/services/backend";
import { uploadImageFile, apiRecord } from "@/services/media-upload";

export async function ensurePhotographerPortfolio(): Promise<string> {
  const portfolios = await portfolioApi.listMyPhotographerPortfolios({ limit: 100 });
  const album = portfolios.items[0]
    ? portfolios.items[0]
    : await portfolioApi.createPortfolio({ name: "Tác phẩm" });
  const portfolioId = String(apiRecord(album).id ?? "");
  if (!portfolioId) throw new Error("Không tìm thấy album portfolio để thêm ảnh.");
  return portfolioId;
}

export async function addPortfolioImages(files: File[]): Promise<void> {
  const portfolioId = await ensurePhotographerPortfolio();
  for (const file of files) {
    const mediaId = await uploadImageFile(file, "private");
    await portfolioApi.addPortfolioItem(portfolioId, { media_id: mediaId });
  }
}
