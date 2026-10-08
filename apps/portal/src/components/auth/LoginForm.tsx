import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ArrowRight } from "lucide-react";
import { Button, Spinner } from "@lens/ui";
import { AuthInput } from "./AuthInput";
import { FormError } from "./FormError";
import { FormField } from "./FormField";
import { PasswordInput } from "./PasswordInput";
import { useGoogleLogin, useLogin } from "@/queries/useAuth";
import { loginSchema, type LoginValues } from "@/lib/auth";
import { portalHomeFor } from "@/lib/links";
import { GOOGLE_REDIRECT_STORAGE_KEY } from "@/services/auth";
import { saveSession } from "@/lib/session";

export function LoginForm() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const login = useLogin();
  const googleLogin = useGoogleLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: standardSchemaResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginValues) => {
    login.mutate(values, {
      onSuccess: (user) => {
        saveSession(user.user, { accessToken: user.accessToken, refreshToken: user.refreshToken });
        window.location.replace(portalHomeFor(user.user.role, redirect));
      },
    });
  };

  const busy = login.isPending || login.isSuccess || googleLogin.isPending || googleLogin.isSuccess;
  const carry = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  const startGoogleLogin = () => {
    try {
      if (redirect) sessionStorage.setItem(GOOGLE_REDIRECT_STORAGE_KEY, redirect);
      else sessionStorage.removeItem(GOOGLE_REDIRECT_STORAGE_KEY);
    } catch {
      /* The callback can still finish without a saved booking redirect. */
    }

    googleLogin.mutate(undefined, {
      onSuccess: ({ authorization_url }) => {
        window.location.assign(authorization_url);
      },
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Chào mừng trở lại</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Đăng nhập để đặt lịch và quản lý các buổi chụp của bạn.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
        <FormField id="email" label="Email" error={errors.email?.message}>
          <AuthInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField id="password" label="Mật khẩu" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        {login.isError && <FormError message={login.error.message} />}

        <Button type="submit" size="lg" disabled={busy} className="h-11 w-full rounded-full">
          {busy ? (
            <Spinner />
          ) : (
            <>
              Đăng nhập
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">hoặc</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={busy}
        onClick={startGoogleLogin}
        className="h-11 w-full rounded-full"
      >
        {googleLogin.isPending || googleLogin.isSuccess ? <Spinner /> : <GoogleIcon />}
        Tiếp tục với Google
      </Button>

      {googleLogin.isError && (
        <div className="mt-3">
          <FormError message={googleLogin.error.message} />
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link to={`/signup${carry}`} className="font-medium text-foreground hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.7-.06-1.38-.18-2.03H12v3.84h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.7 2.92-4.2 2.92-7.17Z"
      />
      <path
        fill="#34A853"
        d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.51A9.74 9.74 0 0 0 12 21.6Z"
      />
      <path
        fill="#FBBC05"
        d="M6.53 13.7a5.85 5.85 0 0 1 0-3.4V7.8H3.28a9.75 9.75 0 0 0 0 8.4l3.25-2.5Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.27c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.35 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.72 5.4l3.25 2.5c.77-2.31 2.93-4.03 5.47-4.03Z"
      />
    </svg>
  );
}
