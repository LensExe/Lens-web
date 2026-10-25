import { avatar } from "@lens/ui";
import { authApi } from "@/services/backend";
import type { AdminLoginInput, AdminSession } from "@/types";

export async function login(input: AdminLoginInput): Promise<AdminSession> {
  const session = await authApi.login(input);
  if (!(session.roles ?? []).includes("admin")) {
    await authApi.logout().catch(() => undefined);
    throw new Error("Tài khoản này không có quyền quản trị Lens.");
  }
  return {
    id: session.user.id,
    name: session.user.fullname || session.user.email,
    email: session.user.email,
    avatar: session.user.avatar_url || avatar(session.user.id),
  };
}
