import { useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { BadgeCheck, CircleAlert, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Spinner,
  toast,
} from "@lens/ui";
import { FormField } from "@/components/FormField";
import { apiErrorMessage } from "@/lib/errors";
import {
  useEmailVerificationStatus,
  useSendEmailVerificationOtp,
  useVerifyEmail,
} from "@/queries/useAuth";

const verificationSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Mã xác minh phải gồm đúng 6 chữ số"),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;
const EMPTY: VerificationFormValues = { otp: "" };

export function EmailVerification({ email }: { email: string }) {
  const { data: emailVerified } = useEmailVerificationStatus();
  const sendOtp = useSendEmailVerificationOtp();
  const verify = useVerifyEmail();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<VerificationFormValues>({
    resolver: standardSchemaResolver(verificationSchema),
    mode: "onChange",
    defaultValues: EMPTY,
  });

  const closeDialog = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset(EMPTY);
  };

  const sendCode = (openOnSuccess: boolean) =>
    sendOtp.mutate(undefined, {
      onSuccess: () => {
        if (openOnSuccess) setOpen(true);
        toast.success(`Mã xác minh đã được gửi đến ${email}`);
      },
      onError: (error) =>
        toast.error(apiErrorMessage(error, "Không thể gửi mã xác minh, vui lòng thử lại")),
    });

  const onSubmit = handleSubmit(({ otp }) =>
    verify.mutate(
      { email, otp },
      {
        onSuccess: () => {
          toast.success("Email đã được xác minh");
          closeDialog(false);
        },
        onError: (error) =>
          toast.error(apiErrorMessage(error, "Mã xác minh không hợp lệ hoặc đã hết hạn")),
      },
    ),
  );

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
        <span
          className={
            emailVerified
              ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          }
        >
          {emailVerified ? <BadgeCheck className="size-3" /> : <CircleAlert className="size-3" />}
          {emailVerified ? "Đã xác minh" : "Chưa xác minh"}
        </span>
        {!emailVerified && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-lg text-[10px]"
            disabled={sendOtp.isPending}
            onClick={() => sendCode(true)}
          >
            {sendOtp.isPending ? <Spinner /> : <MailCheck className="size-3.5" />}
            Xác minh email
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác minh email</DialogTitle>
            <DialogDescription>
              Nhập mã 6 chữ số đã gửi đến <span className="font-medium text-foreground">{email}</span>.
              Mã có hiệu lực trong 5 phút.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <FormField label="Mã xác minh" htmlFor="email-verification-otp" error={errors.otp?.message}>
              <Input
                id="email-verification-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                aria-invalid={!!errors.otp}
                className="h-12 rounded-xl text-center text-lg tracking-[0.5em]"
                {...register("otp", {
                  setValueAs: (value: string) => value.replace(/\D/g, "").slice(0, 6),
                })}
              />
            </FormField>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                disabled={sendOtp.isPending}
                onClick={() => sendCode(false)}
              >
                {sendOtp.isPending && <Spinner />}
                Gửi lại mã
              </Button>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => closeDialog(false)}>
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  className="rounded-full"
                  disabled={!isValid || verify.isPending || sendOtp.isPending}
                >
                  {verify.isPending && <Spinner />}
                  Xác minh
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
