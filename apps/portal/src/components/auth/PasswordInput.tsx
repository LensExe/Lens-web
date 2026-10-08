import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@lens/ui";
import { AuthInput } from "./AuthInput";

export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof AuthInput>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <AuthInput
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="focus-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
