import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Input, Logo, Spinner, ThemeToggle } from "@lens/ui";
import { useAdminLogin } from "@/queries/useAuth";
import { getAdminSession, saveAdminSession } from "@/lib/session";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .pipe(z.email("Email không hợp lệ")),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginValues = z.infer<typeof loginSchema>;

// The admin console's own sign-in, reachable only at `<admin URL>/login` — it
// is never linked from the public site.
export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const login = useAdminLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: standardSchemaResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  // Already signed in (or just signed in and re-rendering) → go where they were headed.
  if (getAdminSession()) return <Navigate to={from} replace />;

  const onSubmit = (values: LoginValues) => {
    login.mutate(values, {
      onSuccess: (session) => {
        saveAdminSession(session);
        navigate(from, { replace: true });
      },
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40 px-5 py-5">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[420px] rounded-[28px] border border-border bg-card p-8">
          <div className="flex items-center gap-2">
            <Logo className="h-7" />
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Admin
            </span>
          </div>

          <div className="mt-8 flex size-11 items-center justify-center rounded-full bg-foreground text-background">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Đăng nhập quản trị</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Khu vực chỉ dành cho quản trị viên Lens.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="admin@lens.vn"
                aria-invalid={!!errors.email}
                className="h-11 rounded-xl px-3.5"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-medium">
                Mật khẩu
              </label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                aria-invalid={!!errors.password}
                className="h-11 rounded-xl px-3.5"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {login.isError && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                {login.error.message}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={login.isPending}
              className="h-11 w-full rounded-full"
            >
              {login.isPending ? (
                <Spinner />
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

        </div>
      </main>
    </div>
  );
}
