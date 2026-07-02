import { photo } from "@lens/ui";
import type { ShootGallery, StoragePlanTier, StorageSummary } from "@/types";
import { GB, planById } from "@/lib/storage";
import { seedGalleries } from "@/mock/storage";

// Cloud-storage "backend" state: delivery galleries + the signed-in photographer's
// plan, persisted to localStorage (survive reload). Only "me" can change plan in
// the UI phase. Balances/quotas are derived, never stored separately.

const GALLERY_DB_KEY = "lens.galleries.v1";
const PLAN_DB_KEY = "lens.storagePlan.v1";
const MB = 1024 * 1024;

function loadGalleries(): ShootGallery[] {
  try {
    const raw = localStorage.getItem(GALLERY_DB_KEY);
    if (raw) return JSON.parse(raw) as ShootGallery[];
  } catch {
    /* storage blocked */
  }
  return seedGalleries.map((g) => ({ ...g }));
}
function loadPlan(): StoragePlanTier {
  try {
    const raw = localStorage.getItem(PLAN_DB_KEY);
    if (raw === "free" || raw === "pro" || raw === "studio") return raw;
  } catch {
    /* storage blocked */
  }
  return "free";
}

let galleries: ShootGallery[] = loadGalleries();
let myPlan: StoragePlanTier = loadPlan();

const saveGalleries = () => {
  try {
    localStorage.setItem(GALLERY_DB_KEY, JSON.stringify(galleries));
  } catch {
    /* storage blocked */
  }
};
const savePlan = () => {
  try {
    localStorage.setItem(PLAN_DB_KEY, myPlan);
  } catch {
    /* storage blocked */
  }
};

const addDaysISO = (fromISO: string, days: number) => {
  const d = new Date(fromISO);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// A photographer's effective plan (only "me" is editable in the UI phase).
const planOf = (photographerId: string): StoragePlanTier =>
  photographerId === "me" ? myPlan : "free";

// Recompute retention + lock for a gallery under a plan (used on plan change).
function reprice(g: ShootGallery, tier: StoragePlanTier): ShootGallery {
  const def = planById(tier);
  const quota = def.quotaPerShootGB * GB;
  return {
    ...g,
    planTier: tier,
    locked: g.sizeBytes > quota,
    expiresAt:
      def.retentionDays == null
        ? null
        : addDaysISO(g.deliveredAt, def.retentionDays),
  };
}

export const galleryOf = (bookingId: string): ShootGallery | null =>
  galleries.find((g) => g.bookingId === bookingId) ?? null;

export function storageSummaryOf(userId: string): StorageSummary {
  const plan = planOf(userId);
  const def = planById(plan);
  const mine = galleries.filter((g) => g.photographerId === userId);
  return {
    plan,
    usedBytes: mine.reduce((s, g) => s + g.sizeBytes, 0),
    galleryCount: mine.length,
    quotaBytesPerShoot: def.quotaPerShootGB * GB,
    retentionDays: def.retentionDays,
  };
}

export function galleriesOf(userId: string): ShootGallery[] {
  return galleries
    .filter((g) => g.photographerId === userId)
    .sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt));
}

export function setPlan(userId: string, tier: StoragePlanTier): StorageSummary {
  if (userId === "me") {
    myPlan = tier;
    // Downgrade locks over-quota galleries (never deletes) + resets retention.
    galleries = galleries.map((g) =>
      g.photographerId === userId ? reprice(g, tier) : g
    );
    savePlan();
    saveGalleries();
  }
  return storageSummaryOf(userId);
}

/** Photographer delivers/adds photos to a booking's gallery (mock upload). */
export function addPhotos(
  bookingId: string,
  photographerId: string,
  clientName: string,
  style: string,
  count = 4
): ShootGallery {
  const tier = planOf(photographerId);
  const def = planById(tier);
  const quota = def.quotaPerShootGB * GB;
  const stamp = Date.now();
  const fresh = Array.from({ length: count }, (_, i) => ({
    id: `up-${stamp}-${i}`,
    url: photo(`up-${bookingId}-${stamp}-${i}`, 600, 800),
    name: `IMG_${2000 + i}.jpg`,
    sizeBytes: 90 * MB,
  }));

  let g = galleries.find((x) => x.bookingId === bookingId);
  if (!g) {
    const sizeBytes = fresh.reduce((s, p) => s + p.sizeBytes, 0);
    const deliveredAt = new Date().toISOString();
    g = {
      bookingId,
      photographerId,
      clientName,
      style,
      photos: fresh,
      sizeBytes,
      deliveredAt,
      expiresAt:
        def.retentionDays == null
          ? null
          : addDaysISO(deliveredAt, def.retentionDays),
      planTier: tier,
      locked: sizeBytes > quota,
    };
    galleries = [g, ...galleries];
  } else {
    const photos = [...g.photos, ...fresh];
    const sizeBytes = photos.reduce((s, p) => s + p.sizeBytes, 0);
    g = { ...g, photos, sizeBytes, locked: sizeBytes > quota };
    galleries = galleries.map((x) => (x.bookingId === bookingId ? g! : x));
  }
  saveGalleries();
  return g;
}
