import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ArrowRight } from "lucide-react";
import { Button, Spinner } from "@lens/ui";
import { AuthInput } from "./AuthInput";
import { DemoAccounts } from "./DemoAccounts";
import { FormError } from "./FormError";
import { FormField } from "./FormField";
import { PasswordInput } from "./PasswordInput";
import { useLogin } from "@/queries/useAuth";
import { loginSchema, type LoginValues } from "@/lib/auth";
import { portalHomeFor } from "@/lib/links";
import type { DemoAccount } from "@/types";

// No role picker: the account's role (from the server) decides where the user
// lands — their portal home, or back to the page that asked them to log in
// (`?redirect=`, portal URLs only).
export function LoginForm() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: standardSchemaResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginValues) => {
    login.mutate(values, {
      // Full navigation: the portal is another app/origin.
      onSuccess: (user) => {
        window.location.href = portalHomeFor(user.role, redirect);
      },
    });
  };

  const fillDemo = ({ email, password }: DemoAccount) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
    login.reset();
  };

  // Stay busy after success while the browser leaves for the portal.
  const busy = login.isPending || login.isSuccess;
  const carry = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

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

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link to={`/signup${carry}`} className="font-medium text-foreground hover:underline">
          Đăng ký
        </Link>
      </p>

      <div className="mt-8">
        <DemoAccounts onPick={fillDemo} />
      </div>
    </div>
  );
}
