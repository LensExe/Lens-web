import { adminApi } from "@/services/backend";
import { record, text, number } from "@/services/normalize";

export interface RankCatalogItem {
  id: string;
  code: string;
  name: string;
  minCompleted: number;
  commissionPercent: number;
}

export interface BadgeCatalogItem {
  id: string;
  code: string;
  name: string;
  description: string;
  metric: string;
  minimumValue: number;
  minimumReviews: number;
  active: boolean;
}

export interface QualityCatalog {
  ranks: RankCatalogItem[];
  badges: BadgeCatalogItem[];
}

export async function getQualityReport(): Promise<QualityCatalog> {
  const [ranks, badges] = await Promise.all([adminApi.listRanks(), adminApi.listBadges()]);
  return {
    ranks: ranks.items.map((raw) => {
      const row = record(raw);
      return {
        id: text(row.id), code: text(row.code), name: text(row.name),
        minCompleted: number(row.min_completed), commissionPercent: number(row.commission_percent),
      };
    }),
    badges: badges.items.map((raw) => {
      const row = record(raw);
      return {
        id: text(row.id), code: text(row.code), name: text(row.name),
        description: text(row.description), metric: text(row.metric),
        minimumValue: number(row.min_value), minimumReviews: number(row.min_reviews),
        active: row.is_active === true,
      };
    }),
  };
}
