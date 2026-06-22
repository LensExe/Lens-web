// Placeholder images for the UI phase — real photos, keyed by a deterministic
// hash so a given seed always resolves to the same image.
//   • avatars → randomuser.me (real human faces, fast & reliable)
//   • photos  → curated Unsplash IDs, sized on the fly with ?w&h&fit=crop
// (picsum.photos timed out; loremflickr baked red letterbox bars into non-square
// crops — both dropped. The Unsplash IDs below were verified to load + themed.)
// Phase 2: swap these for real uploaded URLs (Supabase Storage).
const hashNum = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

// Real Unsplash photo IDs grouped by subject (the keys match the keywords passed
// from HeroVisual / StyleCategories / category seeds).
const POOLS: Record<string, string[]> = {
  wedding: [
    "1519741497674-611481863552",
    "1583939003579-730e3918a45a",
    "1465495976277-4387d4b0b4c6",
    "1511285560929-80b456fea0bc",
    "1606800052052-a08af7148866",
    "1537633552985-df8429e8048b",
    "1469371670807-013ccf25f16a",
  ],
  portrait: [
    "1500648767791-00dcc994a43e",
    "1506794778202-cad84cf45f1d",
    "1438761681033-6461ffad8d80",
    "1507003211169-0a1dd7228f2d",
    "1534528741775-53994a69daeb",
    "1539571696357-5a69c17a67c6",
  ],
  fashion: [
    "1502823403499-6ccfcf4fb453",
    "1524504388940-b1c1722653e1",
    "1529626455594-4ff0802cfb7e",
    "1544005313-94ddf0286df2",
    "1517841905240-472988babdf9",
  ],
  travel: [
    "1469854523086-cc02fe5d8800",
    "1501785888041-af3ef285b470",
    "1530789253388-582c481c54b0",
    "1476514525535-07fb3b4ae5f1",
    "1528127269322-539801943592",
  ],
  food: [
    "1414235077428-338989a2e8c0",
    "1555939594-58d7cb561ad1",
    "1504674900247-0877df9cc836",
    "1565299624946-b28f40a0ae38",
    "1473093295043-cdd812d0e601",
    "1540189549336-e6e99c3679fe",
    "1467003909585-2f8a72700288",
  ],
  event: [
    "1551836022-d5d88e9218df",
    "1504384308090-c894fdcc538d",
    "1573496359142-b8d87734a5a2",
    "1517248135467-4c7edcad34c4",
  ],
};
const ALL_PHOTOS = Object.values(POOLS).flat();

/** A real human-face placeholder for avatars (source size is fixed at 128px). */
export const avatar = (seed: string) => {
  const n = hashNum(seed);
  const gender = n % 2 === 0 ? "men" : "women";
  return `https://randomuser.me/api/portraits/${gender}/${n % 100}.jpg`;
};

/**
 * A real placeholder photo, cropped to exactly w×h. Seeds ending in `-av`
 * resolve to a face avatar; pass `keyword` (wedding | portrait | fashion |
 * travel | food | event) to pin the subject, else a varied photo is chosen.
 */
export const photo = (seed: string, w: number, h: number, keyword?: string) => {
  if (!keyword && seed.includes("-av")) return avatar(seed);
  const n = hashNum(seed);
  const pool = (keyword && POOLS[keyword]) || ALL_PHOTOS;
  const id = pool[n % pool.length];
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;
};
