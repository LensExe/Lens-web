import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Input, cn } from "@lens/ui";

// UI phase: no real auth. Pick a role, "log in", and redirect to the matching
// app — carrying the role in the URL hash (#role=) so the destination signs in
// as that account. The hash is never sent to the server and the portal strips
// it on arrival. URLs come from env so dev/prod just work.
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "http://localhost:5174";
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL ?? "http://localhost:5175";

type Role = "client" | "photographer" | "admin";

const roles: { value: Role; label: string }[] = [
  { value: "client", label: "Khách hàng" },
  { value: "photographer", label: "Nhiếp ảnh gia" },
  { value: "admin", label: "Quản trị" },
];

// Demo credentials per role — autofilled when a role is picked (UI phase only).
const demoAccounts: Record<Role, { email: string; password: string }> = {
  client: { email: "khachhang@lens.vn", password: "demo1234" },
  photographer: { email: "nhiepanhgia@lens.vn", password: "demo1234" },
  admin: { email: "admin@lens.vn", password: "demo1234" },
};

// Where each role lands after login (and the account it signs in as).
// Portal roles (client/photographer) land on the portal root (browse); the
// account menu there reflects the signed-in role. Admin goes to the admin app.
function destinationFor(role: Role): string {
  if (role === "admin") return ADMIN_URL;
  return `${PORTAL_URL}/#role=${role}`;
}

/** Shared login form — used by the auth modal and the `/login` page. */
export function LoginForm({
  onNavigateAway,
  showHeading = true,
  showSwitchLink = true,
}: {
  onNavigateAway?: () => void;
  /** The modal renders its own DialogTitle/Description instead. */
  showHeading?: boolean;
  /** The modal switches via tabs, so it hides this footer link. */
  showSwitchLink?: boolean;
}) {
  const [role, setRole] = useState<Role>("client");
  const [email, setEmail] = useState(demoAccounts.client.email);
  const [password, setPassword] = useState(demoAccounts.client.password);

  // Picking a role autofills its demo credentials.
  const selectRole = (value: Role) => {
    setRole(value);
    setEmail(demoAccounts[value].email);
    setPassword(demoAccounts[value].password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to the matching app, carrying the role so it signs in correctly.
    window.location.href = destinationFor(role);
  };

  return (
    <div>
      {showHeading && (
        <>
          <h2 className="text-2xl font-semibold tracking-tight">Đăng nhập</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chào mừng trở lại. Chọn vai trò và đăng nhập để tiếp tục.
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} className={cn("space-y-4", showHeading && "mt-6")}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="ban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Mật khẩu
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Vai trò</span>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => selectRole(r.value)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition-colors",
                  role === r.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full rounded-full">
          Đăng nhập
          <ArrowRight className="size-4" />
        </Button>
      </form>

      {showSwitchLink && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            to="/signup"
            onClick={onNavigateAway}
            className="font-medium text-foreground hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Giai đoạn UI: chọn vai trò sẽ tự điền tài khoản demo và đăng nhập vào
        ứng dụng tương ứng (Portal / Admin).
      </p>
    </div>
  );
}
