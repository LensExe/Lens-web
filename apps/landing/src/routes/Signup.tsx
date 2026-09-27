import { SignupForm } from "@/components/auth/SignupForm";

// `/signup` — rendered inside AuthLayout (no marketing navbar).
// `?role=photographer` preselects the photographer account type.
export function Signup() {
  return <SignupForm />;
}
