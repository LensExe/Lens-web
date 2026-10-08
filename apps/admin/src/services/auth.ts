import { avatar } from "@lens/ui";
import { authApi } from "@/services/backend";
import type { AdminLoginInput, AdminSession } from "@/types";

function rolesFromToken(token: string): string[] {
  try {
    const payload = token.split(".")[1];
    if (!payload) return [];
    const claims = JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/"))) as {
      realm_access?: { roles?: string[] };
      roles?: string[];
    };
    return [...(claims.realm_access?.roles ?? []), ...(claims.roles ?? [])];
  } catch {
    return [];
  }
}

export async function login(input: AdminLoginInput): Promise<AdminSession> {
  const session = await authApi.login(input);
  if (!rolesFromToken(session.access_token).includes("admin")) {
    throw new Error("Tài khoản này không có quyền quản trị Lens.");
  }
  return {
    id: session.user.id,
    name: session.user.fullname || session.user.email,
    email: session.user.email,
    avatar: session.user.avatar_url || avatar(session.user.id),
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}
