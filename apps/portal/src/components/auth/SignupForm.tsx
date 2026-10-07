import { Link, useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ArrowRight, Camera, Check, Search } from "lucide-react";
import { Button, Spinner, cn } from "@lens/ui";
import { AuthInput } from "./AuthInput";
import { FormError } from "./FormError";
import { FormField } from "./FormField";
import { PasswordInput } from "./PasswordInput";
import { useRegister } from "@/queries/useAuth";
import { isPortalRole, signupSchema, type SignupValues } from "@/lib/auth";
import { portalHomeFor } from "@/lib/links";
import { saveSession } from "@/lib/session";
import type { PortalRole } from "@/types";

const ROLE_OPTIONS: {
  value: PortalRole;
  title: string;
  hint: string;
  Icon: typeof Camera;
}[] = [
  {
    value: "client",
    title: "Tôi muốn thuê nhiếp ảnh gia",
    hint: "Tìm, so sánh và đặt lịch chụp",
    Icon: Search,
  },
  {
    value: "photographer",
    title: "Tôi là nhiếp ảnh gia",
    hint: "Nhận lịch và phát triển thương hiệu",
    Icon: Camera,
  },
];

const SUBTITLES: Record<PortalRole, string> = {
  client: "Tìm và đặt lịch với nhiếp ảnh gia phù hợp chỉ trong vài phút.",
  photographer: "Tạo hồ sơ, nhận lịch chụp và phát triển thương hiệu của bạn.",
};

export function SignupForm() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const presetRole = searchParams.get("role");
  const signup = useRegister();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: standardSchemaResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      role: isPortalRole(presetRole) ? presetRole : "client",
      name: "",
      email: "",
      password: "",
    },
  });

  const role = useWatch({ control, name: "role" });

  const onSubmit = (values: SignupValues) => {
    signup.mutate(values, {
      onSuccess: (user) => {
        saveSession(user.user, { accessToken: user.accessToken, refreshToken: user.refreshToken });
        window.location.replace(portalHomeFor(user.user.role, redirect));
      },
    });
  };

  const busy = signup.isPending || signup.isSuccess;
  const carry = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Tạo tài khoản Lens</h1>
      <p className="mt-2 text-sm text-muted-foreground">{SUBTITLES[role]}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
        <div role="radiogroup" aria-label="Loại tài khoản" className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map(({ value, title, hint, Icon }) => {
            const selected = role === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setValue("role", value)}
                className={cn(
                  "focus-ring relative rounded-2xl border p-4 text-left transition-colors",
                  selected
                    ? "border-foreground bg-foreground/3 ring-1 ring-foreground"
                    : "border-border hover:bg-muted/60"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full",
                    selected ? "bg-foreground text-background" : "bg-muted"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="mt-3 block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                {selected && <Check className="absolute right-3 top-3 size-4" aria-hidden />}
              </button>
            );
          })}
        </div>

        <FormField id="signup-name" label="Họ và tên" error={errors.name?.message}>
          <AuthInput
            id="signup-name"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </FormField>

        <FormField id="signup-email" label="Email" error={errors.email?.message}>
          <AuthInput
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField id="signup-password" label="Mật khẩu" error={errors.password?.message}>
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            placeholder="Ít nhất 8 ký tự"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        {signup.isError && <FormError message={signup.error.message} />}

        <Button type="submit" size="lg" disabled={busy} className="h-11 w-full rounded-full">
          {busy ? (
            <Spinner />
          ) : (
            <>
              Tạo tài khoản
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Lens.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link to={`/login${carry}`} className="font-medium text-foreground hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
