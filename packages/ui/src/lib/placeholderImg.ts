// Placeholder images for the UI phase — real photos, keyed by a deterministic
// hash so a given seed always resolves to the same image.
//   • avatars → randomuser.me (real human faces, fast & reliable)
//   • photos  → local files served from each app's /public/photos/<folder>/
//     (copied from the project's own photo source, organised by genre).
// Phase 2: swap these for real uploaded URLs (Supabase Storage).
const hashNum = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

// Local photo folders under /public/photos. `count` = files in the folder,
// `prefix` = filename stem (files are `<prefix>_<1..count>.jpg`, not zero-padded).
const FOLDERS: Record<string, { count: number; prefix: string }> = {
  portrait: { count: 10, prefix: "portrait" },
  family: { count: 10, prefix: "family" },
  event: { count: 10, prefix: "event" },
  food: { count: 10, prefix: "food" },
  product: { count: 10, prefix: "product" },
  street: { count: 10, prefix: "street" },
  architecture: { count: 10, prefix: "arc" },
  travel: { count: 6, prefix: "travel" },
};

// Map every keyword we receive — both the legacy pool keywords still passed by
// HeroVisual / StyleCategories and the new genre folder names — onto a folder.
// The source has 8 folders for 10 styles, so `wedding`→family and `fashion`→
// portrait reuse the nearest genre (different seeds still yield different images).
const KEYWORD_TO_FOLDER: Record<string, string> = {
  portrait: "portrait",
  fashion: "portrait",
  wedding: "family",
  family: "family",
  event: "event",
  food: "food",
  product: "product",
  street: "street",
  architecture: "architecture",
  travel: "travel",
};

// Flat list of every file path, for the no-keyword "varied photo" case.
const ALL_PHOTOS = Object.entries(FOLDERS).flatMap(([folder, { count, prefix }]) =>
  Array.from({ length: count }, (_, i) => `/photos/${folder}/${prefix}_${i + 1}.jpg`)
);

const fileInFolder = (folder: string, n: number) => {
  const { count, prefix } = FOLDERS[folder];
  return `/photos/${folder}/${prefix}_${(n % count) + 1}.jpg`;
};

/** A real human-face placeholder for avatars (source size is fixed at 128px). */
export const avatar = (seed: string) => {
  const n = hashNum(seed);
  const gender = n % 2 === 0 ? "men" : "women";
  return `https://randomuser.me/api/portraits/${gender}/${n % 100}.jpg`;
};

/**
 * A real placeholder photo. Seeds that look like avatars (`-av`, `-rv`, or
 * containing `reviewer`) resolve to a face avatar; pass `keyword` (a genre —
 * portrait | fashion | wedding | family | event | food | product | street |
 * architecture | travel) to pin the subject, else a varied photo is chosen.
 * `w`/`h` are kept for call-site compatibility but no longer size the URL
 * (files are static; components set the display size via CSS).
 */
export const photo = (seed: string, _w: number, _h: number, keyword?: string) => {
  if (!keyword && /(-av|-rv|reviewer)/.test(seed)) return avatar(seed);
  const n = hashNum(seed);
  const folder = keyword ? KEYWORD_TO_FOLDER[keyword] : undefined;
  if (folder) return fileInFolder(folder, n);
  return ALL_PHOTOS[n % ALL_PHOTOS.length];
};
