import { api } from "@/lib/api";
import type { AuthUser, DemoAccount, LoginInput, SignupInput } from "@/types";

export async function login(input: LoginInput): Promise<AuthUser> {
  return (await api.post<AuthUser>("/auth/login", input)).data;
}

export async function register(input: SignupInput): Promise<AuthUser> {
  return (await api.post<AuthUser>("/auth/register", input)).data;
}

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  return (await api.get<DemoAccount[]>("/auth/demo-accounts")).data;
}
