# Deploy — Lens (3 app, deploy độc lập)

Cả 3 app nằm chung 1 monorepo nhưng **build + deploy riêng**. Host khuyến nghị: **Vercel** (mỗi app 1 project, cùng trỏ về 1 repo, khác nhau ở **Root Directory**). Bất kỳ host tĩnh nào cũng chạy được vì output là `dist/` của Vite.

Phần code đã sẵn sàng: mỗi app có `vercel.json` (Vercel tự đọc) — **không cần sửa**. Bạn chỉ thao tác trên dashboard theo các bước dưới.

---

## Các bước làm trên Vercel (làm theo thứ tự)

### Bước 0 — Đưa code lên Git (bắt buộc)
Vercel deploy từ GitHub/GitLab/Bitbucket, nên repo phải nằm trên đó trước.
1. Tạo repo trên GitHub (vd `lens`).
2. Trong thư mục dự án:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<bạn>/lens.git
   git push -u origin main
   ```
3. Kiểm tra `.gitignore` đã loại `node_modules`, `dist`, `.env` (đừng đẩy `node_modules`).

### Bước 1 — Tạo project đầu tiên (landing)
1. Vào [vercel.com](https://vercel.com) → **Add New… → Project**.
2. **Import** repo `lens` vừa push.
3. Màn hình cấu hình:
   - **Root Directory** → bấm **Edit** → chọn `apps/landing`.
   - ⚠️ Tích **"Include source files outside of the Root Directory"** (cần `packages/ui` + `pnpm-workspace.yaml` ở root khi cài đặt).
   - Framework / Build / Install: **để mặc định** — Vercel đọc từ `apps/landing/vercel.json`. Đừng sửa.
4. Mở **Environment Variables** (scope **Production**), thêm:
   - `VITE_PORTAL_URL` = URL portal (chưa có thì điền tạm, Bước 3 quay lại sửa)
   - `VITE_ADMIN_URL` = URL admin
   - `VITE_API_MOCKING` = `enabled` (bật mock backend MSW — bắt buộc, vì `.env` không commit)
5. Bấm **Deploy**.

### Bước 2 — Tạo 2 project còn lại
Lặp lại Bước 1, mỗi lần **Add New Project → import cùng repo `lens`**, chỉ khác Root Directory + env:

| Project       | Root Directory | Env vars (Production)                                       |
| ------------- | -------------- | ---------------------------------------------------------- |
| lens-portal   | `apps/portal`  | `VITE_LANDING_URL`, `VITE_ADMIN_URL`, `VITE_API_MOCKING`   |
| lens-admin    | `apps/admin`   | `VITE_LANDING_URL`, `VITE_PORTAL_URL`, `VITE_API_MOCKING`  |

> Vercel cho phép nhiều project trỏ cùng 1 repo — cứ import lại bình thường.

### Bước 3 — Nối URL thật giữa các app
Sau khi cả 3 deploy xong, mỗi project có 1 URL (vd `lens-landing.vercel.app`):
1. Vào từng project → **Settings → Environment Variables**.
2. Sửa các `VITE_*_URL` thành URL thật của app tương ứng.
3. **Deployments → … → Redeploy** (vì `VITE_` nhúng lúc build, đổi env phải build lại).

### Bước 4 — Kiểm tra
- Mở từng URL, vào route con (vd `/photographers/p1`) rồi **F5** → KHÔNG được 404 (nhờ SPA rewrites).
- Ở landing bấm **Đăng nhập** → chọn role → phải nhảy đúng sang URL portal/admin.
- (Tuỳ chọn) Gắn **custom domain** ở **Settings → Domains** của từng project.

### Từ giờ về sau
Mỗi lần `git push`, Vercel tự build lại — nhờ `turbo-ignore`, **chỉ app nào thay đổi mới build lại**, app khác bỏ qua.

---

## Tham chiếu cấu hình (đã set sẵn trong `vercel.json`)

| Vercel project | Root Directory | Đọc config từ              |
| -------------- | -------------- | -------------------------- |
| lens-landing   | `apps/landing` | `apps/landing/vercel.json` |
| lens-portal    | `apps/portal`  | `apps/portal/vercel.json`  |
| lens-admin     | `apps/admin`   | `apps/admin/vercel.json`   |

Mỗi `vercel.json` đã cấu hình:
- **install** ở root (`pnpm install` — để workspace `@lens/ui` resolve được),
- **build** qua script root (`pnpm build:<app>`),
- **outputDirectory** `dist` (tương đối theo app),
- **ignoreCommand** `turbo-ignore <app>` → push chỉ rebuild app có thay đổi (hoặc khi `@lens/ui` đổi),
- **SPA rewrites** (`/(.*) → /index.html`) → route client không 404 khi F5.

### Biến môi trường (set theo từng project, scope Production)
**`.env` KHÔNG commit lên git** (đã gitignore) — toàn bộ env production set trên dashboard. File `.env.example` trong mỗi app liệt kê các biến cần có; local dev thì `cp .env.example .env`.

| Project  | Biến cần set (Production)                                   |
| -------- | ---------------------------------------------------------- |
| landing  | `VITE_PORTAL_URL`, `VITE_ADMIN_URL`, `VITE_API_MOCKING`    |
| portal   | `VITE_LANDING_URL`, `VITE_ADMIN_URL`, `VITE_API_MOCKING`   |
| admin    | `VITE_LANDING_URL`, `VITE_PORTAL_URL`, `VITE_API_MOCKING`  |

- `VITE_*_URL` = URL deploy thật của các app (vd `https://lens-web-portal.vercel.app`).
- `VITE_API_MOCKING` = `enabled` → bật mock backend MSW. **Bắt buộc** ở phase UI: thiếu nó thì app deploy gọi `/api/*` mà không ai trả lời → trắng dữ liệu. (Khi có backend thật: đổi thành `disabled` + thêm `VITE_API_URL`.)
- Không có secret — chỉ URL + cờ. Biến `VITE_` nhúng lúc build → đổi xong phải **Redeploy**.

---

## Host khác (VPS / nginx / Cloudflare Pages / Netlify)

Build local hoặc CI rồi serve `dist/` tĩnh:

```bash
pnpm install
pnpm build:landing   # → apps/landing/dist
pnpm build:portal    # → apps/portal/dist
pnpm build:admin     # → apps/admin/dist
```

Yêu cầu duy nhất của host: **SPA fallback** — rewrite mọi path lạ về `/index.html`. Với nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
