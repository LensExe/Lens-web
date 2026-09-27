import { AlertCircle } from "lucide-react";

/** A form-level error returned by the server (e.g. wrong password). */
export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" />
      {message}
    </p>
  );
}
