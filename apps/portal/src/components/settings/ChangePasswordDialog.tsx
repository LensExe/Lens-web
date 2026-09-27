import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { KeyRound } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Spinner,
  toast,
} from "@lens/ui";
import { FormField } from "@/components/FormField";
import { useChangePassword } from "@/queries/useProfile";
import { passwordSchema, type PasswordFormValues } from "@/lib/profile";

const EMPTY: PasswordFormValues = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: standardSchemaResolver(passwordSchema),
    mode: "onTouched",
    defaultValues: EMPTY,
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset(EMPTY);
  };

  const onSubmit = ({ currentPassword, newPassword }: PasswordFormValues) =>
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Đã đổi mật khẩu");
          onOpenChange(false);
        },
        onError: () => toast.error("Không thể đổi mật khẩu, vui lòng thử lại"),
      }
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <KeyRound className="size-4" />
          Đổi mật khẩu
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>Mật khẩu mới cần ít nhất 8 ký tự.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="Mật khẩu hiện tại" htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className="h-10 rounded-xl"
              {...register("currentPassword")}
            />
          </FormField>
          <FormField label="Mật khẩu mới" htmlFor="newPassword" error={errors.newPassword?.message}>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className="h-10 rounded-xl"
              {...register("newPassword")}
            />
          </FormField>
          <FormField label="Xác nhận mật khẩu mới" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="h-10 rounded-xl"
              {...register("confirmPassword")}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" className="rounded-full" disabled={change.isPending}>
              {change.isPending && <Spinner />}
              Cập nhật mật khẩu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
