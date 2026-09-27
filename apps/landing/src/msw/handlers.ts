import { http, HttpResponse } from "msw";
import { avatar, delay } from "@lens/ui";
import { mockPhotographers } from "@/mock/photographers";
import { mockAccounts, type MockAccount } from "@/mock/users";
import { mockStyles } from "@/mock/styles";
import type {
  AuthUser,
  DemoAccount,
  LoginInput,
  PortalRole,
  SignupInput,
  StyleCategory,
} from "@/types";

// Mock backend for landing. Handlers play the role of the server: they read the
// mock data ("database seed") and answer the HTTP requests the services make.
// `delay()` simulates network latency so loading skeletons stay visible.

// In-memory accounts table (resets on full reload) so sign-ups can log in.
let accounts: MockAccount[] = [...mockAccounts];

const findByEmail = (email: string) => {
  const key = email.trim().toLowerCase();
  return accounts.find((a) => a.email.toLowerCase() === key);
};

const toAuthUser = ({ id, name, email, avatar, role }: MockAccount): AuthUser => ({
  id,
  name,
  email,
  avatar,
  role: role as PortalRole,
});

export const handlers = [
  // GET /api/photographers  (?featured=true → only featured ones)
  http.get("/api/photographers", async ({ request }) => {
    await delay();
    const featured = new URL(request.url).searchParams.get("featured");
    const data =
      featured === "true"
        ? mockPhotographers.filter((p) => p.featured)
        : mockPhotographers;
    return HttpResponse.json(data);
  }),

  // GET /api/photographers/:id  (null body when not found, like a 200 empty)
  http.get("/api/photographers/:id", async ({ params }) => {
    await delay();
    const found = mockPhotographers.find((p) => p.id === params.id);
    return HttpResponse.json(found ?? null);
  }),

  // GET /api/styles → every style + how many photographers offer it.
  http.get("/api/styles", async () => {
    await delay();
    const data: StyleCategory[] = mockStyles.map((s) => ({
      ...s,
      photographerCount: mockPhotographers.filter((p) => p.styles.includes(s.label))
        .length,
    }));
    return HttpResponse.json(data);
  }),

  // ── Auth (UI phase — no tokens; the role is handed to the portal) ─────────
  // POST /api/auth/login → the account's public fields, or 401. Admins sign in
  // on the admin app only, so they get the exact same answer as a wrong
  // password — the public form never reveals that an admin account exists.
  http.post("/api/auth/login", async ({ request }) => {
    await delay();
    const { email, password } = (await request.json()) as LoginInput;
    const account = findByEmail(email);
    if (!account || account.role === "admin" || account.password !== password) {
      return HttpResponse.json(
        { message: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }
    return HttpResponse.json(toAuthUser(account));
  }),

  // POST /api/auth/register → creates a client/photographer account.
  http.post("/api/auth/register", async ({ request }) => {
    await delay();
    const input = (await request.json()) as SignupInput;
    if (findByEmail(input.email)) {
      return HttpResponse.json(
        { message: "Email này đã được sử dụng" },
        { status: 409 }
      );
    }
    const email = input.email.trim().toLowerCase();
    const account: MockAccount = {
      id: `u-${Date.now()}`,
      name: input.name.trim(),
      avatar: avatar(email),
      email,
      role: input.role,
      city: "",
      password: input.password,
    };
    accounts = [...accounts, account];
    return HttpResponse.json(toAuthUser(account), { status: 201 });
  }),

  // GET /api/auth/demo-accounts → the demo logins shown under the login form.
  http.get("/api/auth/demo-accounts", async () => {
    await delay();
    const demo: DemoAccount[] = accounts
      .filter((a) => a.demo)
      .map(({ email, password, role }) => ({
        email,
        password,
        role: role as PortalRole,
      }));
    return HttpResponse.json(demo);
  }),
];
