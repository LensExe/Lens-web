import { api } from "@/lib/api";
import type { AuthUser, DemoAccount, LoginInput, SignupInput } from "@/types";

// Layer 3 — Service / API. Thin HTTP calls for sign-in / sign-up.

export async function login(input: LoginInput): Promise<AuthUser> {
  return (await api.post<AuthUser>("/auth/login", input)).data;
}

export async function register(input: SignupInput): Promise<AuthUser> {
  return (await api.post<AuthUser>("/auth/register", input)).data;
}

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  return (await api.get<DemoAccount[]>("/auth/demo-accounts")).data;
}
