# Lens — Photographer Marketplace

Nền tảng kết nối khách hàng với nhiếp ảnh gia trên khắp Việt Nam (marketplace hai chiều).
**Giai đoạn hiện tại: UI ONLY** — chưa có backend/auth/payment; dữ liệu lấy từ mock trong mỗi app.

> Quy ước & "hiến pháp" dự án nằm ở [`CLAUDE.md`](./CLAUDE.md). Design system ở [`DESIGN.md`](./DESIGN.md). Mỗi app/package có `CLAUDE.md` riêng.

## Kiến trúc — pnpm monorepo (3 app + 1 package dùng chung)

```
lens/
├─ packages/
│  └─ ui/            @lens/ui — design system dùng chung (shadcn, React Bits,
│                    theme, hooks motion, tokens CSS). KHÔNG chứa data.
└─ apps/
   ├─ landing/       🌐 Marketing + Auth        → dev http://localhost:5173
   ├─ portal/        👤 Khách hàng + Nhiếp ảnh gia → dev http://localhost:5174
   └─ admin/         🛡️  Quản trị                 → dev http://localhost:5175
```

- **Code giao diện dùng chung** sống ở `@lens/ui`, import qua: `import { Button } from "@lens/ui"`.
- **Dữ liệu (types / services / queries / mock / stores) nằm trong từng app** — mỗi app có API riêng.
- 3 app **build & deploy độc lập**; giao tiếp với nhau qua URL trong biến môi trường.

## Tech stack

Vite + React 19 + TypeScript · React Compiler · Tailwind CSS v4 · shadcn/ui · React Router · TanStack Query + axios · Zustand · react-hook-form + zod · lucide-react · date-fns.
Hiệu ứng: GSAP, Three.js (@react-three/fiber), Lenis, React Bits, animate-text.
Monorepo: **pnpm workspaces + Turborepo**.

## Bắt đầu

```bash
pnpm install          # cài cho cả workspace (1 lần)

pnpm dev              # chạy CẢ 3 app song song (Turborepo)
#   landing → http://localhost:5173
#   portal  → http://localhost:5174
#   admin   → http://localhost:5175

pnpm dev:landing      # chạy riêng 1 app (hoặc dev:portal / dev:admin)
```

## Build

```bash
pnpm build            # build cả 3 app → apps/<app>/dist
pnpm build:landing    # build riêng 1 app (hoặc build:portal / build:admin)
```
Turborepo chỉ build lại app nào có thay đổi (hoặc khi `@lens/ui` đổi) và cache kết quả.

## Đăng nhập & điều hướng theo vai trò (giai đoạn UI)

Chưa có auth thật. Màn đăng nhập ở **landing** (`/login`) cho chọn vai trò rồi chuyển hướng:

| Vai trò | Chuyển tới |
|---|---|
| Khách hàng / Nhiếp ảnh gia | **portal** (`VITE_PORTAL_URL`) |
| Quản trị | **admin** (`VITE_ADMIN_URL`) |

URL khai trong `.env` của mỗi app (mặc định localhost khi dev).

## Thêm component shadcn / React Bits

Chạy CLI **trong `packages/ui`** để component vào đúng design system dùng chung:

```bash
cd packages/ui
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add "https://reactbits.dev/r/<Component>-TS-TW"
```
Sau đó export trong `packages/ui/src/index.ts` để các app dùng được.

## Deploy

Mỗi app deploy độc lập (`dist/` riêng), tới host bất kỳ (Vercel / VPS / cloud — trộn thoải mái).
1 repo → CI theo từng app: `git push` chỉ build lại app nào thay đổi.
File cấu hình deploy (`vercel.json` / GitHub Actions / nginx) sẽ thêm khi triển khai thật.

## Cấu trúc mỗi app

```
apps/<app>/src/
├─ main.tsx  App.tsx  index.css   # index.css import @lens/ui globals
├─ routes/        # trang (lớp View)
├─ components/     # component riêng của app (layout, sections)
├─ types/  services/  queries/  mock/  stores/   # data riêng của app
└─ lib/api.ts      # axios instance của app
```

Dữ liệu chảy qua 3 lớp: **View → Query hook (`queries/`) → Service (`services/`) → mock**. Đổi mock sang API thật về sau chỉ cần sửa lớp `services/`.
