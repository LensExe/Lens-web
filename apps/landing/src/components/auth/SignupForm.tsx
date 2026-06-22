import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Input, cn } from "@lens/ui";

// UI phase: no real auth. Pick an account type, "sign up", and redirect to
// the portal. URL comes from env so dev/prod just work.
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "http://localhost:5174";

type Role = "client" | "photographer";

const roles: { value: Role; label: string; hint: string }[] = [
  { value: "client", label: "Khách hàng", hint: "Tôi muốn đặt lịch chụp" },
  { value: "photographer", label: "Nhiếp ảnh gia", hint: "Tôi muốn nhận lịch chụp" },
];

/** Shared signup form — used by the auth modal and the `/signup` page. */
export function SignupForm({
  showHeading = true,
  showSwitchLink = true,
  onNavigateAway,
}: {
  showHeading?: boolean;
  showSwitchLink?: boolean;
  onNavigateAway?: () => void;
}) {
  const [role, setRole] = useState<Role>("client");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI phase: both client and photographer land in the portal.
    window.location.href = PORTAL_URL;
  };

  return (
    <div>
      {showHeading && (
        <>
          <h2 className="text-2xl font-semibold tracking-tight">Tạo tài khoản</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tham gia Lens — chọn loại tài khoản để bắt đầu.
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} className={cn("space-y-4", showHeading && "mt-6")}>
        <div className="space-y-2">
          <span className="text-sm font-medium">Tôi là</span>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  role === r.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="block font-medium">{r.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs",
                    role === r.value ? "text-background/70" : "text-muted-foreground"
                  )}
                >
                  {r.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-name" className="text-sm font-medium">
            Họ và tên
          </label>
          <Input id="signup-name" type="text" placeholder="Nguyễn Văn A" defaultValue="Người dùng Lens" />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium">
            Email
          </label>
          <Input id="signup-email" type="email" placeholder="ban@example.com" defaultValue="demo@lens.vn" />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium">
            Mật khẩu
          </label>
          <Input id="signup-password" type="password" placeholder="Ít nhất 8 ký tự" defaultValue="demo1234" />
        </div>

        <Button type="submit" size="lg" className="w-full rounded-full">
          Tạo tài khoản
          <ArrowRight className="size-4" />
        </Button>
      </form>

      {showSwitchLink && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            onClick={onNavigateAway}
            className="font-medium text-foreground hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Giai đoạn UI: tạo tài khoản sẽ chuyển tới Portal.
      </p>
    </div>
  );
}
