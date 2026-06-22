import { createContext, useContext } from "react";

export interface AuthModalContextValue {
  openLogin: () => void;
  openSignup: () => void;
}

export const AuthModalContext = createContext<AuthModalContextValue | null>(null);

/** Open the auth modal (login or signup) from anywhere in the landing app. */
export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within <AuthModalProvider>");
  return ctx;
}
