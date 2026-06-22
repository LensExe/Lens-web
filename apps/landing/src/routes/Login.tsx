import { Link } from "react-router-dom";
import { Aperture } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

// Direct `/login` page — the primary entry point is the auth modal (opened
// from the nav/footer), but this keeps a shareable URL working too.
export function Login() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="rounded-[28px] border border-border bg-card p-8 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.25)]">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-foreground text-background">
            <Aperture className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Lens</span>
        </Link>

        <LoginForm />
      </div>
    </div>
  );
}
