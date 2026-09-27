import { api } from "@/lib/api";
import type { AdminDemoAccount, AdminLoginInput, AdminSession } from "@/types";

// Layer 3 — Service / API. Admin sign-in.

export async function login(input: AdminLoginInput): Promise<AdminSession> {
  return (await api.post<AdminSession>("/auth/login", input)).data;
}

export async function getDemoAccounts(): Promise<AdminDemoAccount[]> {
  return (await api.get<AdminDemoAccount[]>("/auth/demo-accounts")).data;
}
