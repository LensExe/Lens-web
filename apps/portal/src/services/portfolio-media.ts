import { portfolioApi } from "@/services/backend";
import { uploadImageFile, apiRecord } from "@/services/media-upload";

export async function addPortfolioImages(files: File[]): Promise<void> {
  const portfolios = await portfolioApi.listMyPhotographerPortfolios({ limit: 100 });
  const album = portfolios.items[0]
    ? await portfolioApi.getPortfolio(String(apiRecord(portfolios.items[0]).id))
    : await portfolioApi.createPortfolio({ name: "Tác phẩm" });
  const portfolioId = String(apiRecord(album).id ?? "");
  if (!portfolioId) throw new Error("Không tìm thấy album portfolio để thêm ảnh.");

  for (const file of files) {
    const mediaId = await uploadImageFile(file, "private");
    await portfolioApi.addPortfolioItem(portfolioId, { media_id: mediaId });
  }
}
