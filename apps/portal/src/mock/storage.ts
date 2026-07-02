import { photo } from "@lens/ui";
import type { ShootGallery } from "@/types";

// Seed delivery galleries. Imported ONLY by src/msw/storage.ts. Booking ids match
// mock/bookings.ts. Covers every UI state: normal, expiring-soon (warning), and
// locked-by-downgrade (over quota, not deleted).

const MB = 1024 * 1024;
const isoAt = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

function build(seed: string, count: number, perMB: number) {
  const photos = Array.from({ length: count }, (_, i) => ({
    id: `${seed}-p${i}`,
    url: photo(`${seed}-p${i}`, 600, 800),
    name: `IMG_${1000 + i}.jpg`,
    sizeBytes: perMB * MB,
  }));
  return { photos, sizeBytes: count * perMB * MB };
}

const inFive = build("g-in5", 12, 118); // ~1.38 GB
const bkThree = build("g-tkh3", 10, 112); // ~1.09 GB — expiring soon
const bkFour = build("g-tkh4", 16, 200); // ~3.13 GB — pro plan
const inSix = build("g-in6", 14, 205); // ~2.80 GB — locked by downgrade

export const seedGalleries: ShootGallery[] = [
  // Delivered by "me" — normal, ~21 days retention left (Free plan).
  {
    bookingId: "in-5",
    photographerId: "me",
    clientName: "Hoàng Thị Em",
    style: "Chân dung",
    photos: inFive.photos,
    sizeBytes: inFive.sizeBytes,
    deliveredAt: isoAt(-9),
    expiresAt: isoAt(21),
    planTier: "free",
    locked: false,
  },
  // Delivered by "me" but LOCKED: 2.8GB > Free 2GB/shoot after a downgrade.
  {
    bookingId: "in-6",
    photographerId: "me",
    clientName: "Vũ Hồng Phong",
    style: "Gia đình",
    photos: inSix.photos,
    sizeBytes: inSix.sizeBytes,
    deliveredAt: isoAt(-2),
    expiresAt: isoAt(28),
    planTier: "free",
    locked: true,
  },
  // Delivered by p6 to the demo client (held booking) — EXPIRING SOON (3 days).
  {
    bookingId: "bk-tkh-3",
    photographerId: "p6",
    clientName: "Trần Khách Hàng",
    style: "Sự kiện",
    photos: bkThree.photos,
    sizeBytes: bkThree.sizeBytes,
    deliveredAt: isoAt(-27),
    expiresAt: isoAt(3),
    planTier: "free",
    locked: false,
  },
  // Delivered by p1 to the demo client (released booking) — Pro plan, safe.
  {
    bookingId: "bk-tkh-4",
    photographerId: "p1",
    clientName: "Trần Khách Hàng",
    style: "Chân dung",
    photos: bkFour.photos,
    sizeBytes: bkFour.sizeBytes,
    deliveredAt: isoAt(-14),
    expiresAt: isoAt(351),
    planTier: "pro",
    locked: false,
  },
];
