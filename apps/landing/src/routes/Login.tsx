import { Link } from "react-router-dom";
import { Logo } from "@lens/ui";
import { LoginForm } from "@/components/auth/LoginForm";

// Direct `/login` page — the primary entry point is the auth modal (opened
// from the nav/footer), but this keeps a shareable URL working too.
export function Login() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="rounded-[28px] border border-border bg-card p-8 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.25)]">
        <Link to="/" className="mb-6 flex items-center" aria-label="Lens">
          <Logo className="h-7" />
        </Link>

        <LoginForm />
      </div>
    </div>
  );
}
