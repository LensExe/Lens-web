import { avatar } from "@lens/ui";
import { authApi, type AuthSession } from "@/services/backend";
import { mapBackendRole } from "@/lib/session";
import type { AuthUser, LoginInput, SignupInput } from "@/types";

export interface PortalAuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/** Temporary redirect target kept while the browser is away at Google/Keycloak. */
export const GOOGLE_REDIRECT_STORAGE_KEY = "lens.auth.google.redirect";

function tokenRoles(token: string): string[] {
  try {
    const payload = token.split(".")[1];
    if (!payload) return [];
    const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
    const claims = JSON.parse(atob(normalized)) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
      roles?: string[];
    };
    return [
      ...(claims.realm_access?.roles ?? []),
      ...(claims.roles ?? []),
      ...Object.values(claims.resource_access ?? {}).flatMap((item) => item.roles ?? []),
    ];
  } catch {
    return [];
  }
}

function toPortalAuthResult(session: AuthSession): PortalAuthResult {
  const raw = session.user as AuthSession["user"] & { role?: string; roles?: string[] };
  const role =
    mapBackendRole(raw.role) ??
    [...(raw.roles ?? []), ...tokenRoles(session.access_token)].map(mapBackendRole).find(Boolean);
  if (!role) {
    throw new Error("Backend không trả role customer/photographer cho tài khoản này.");
  }
  const name = raw.fullname?.trim() || raw.email;
  return {
    user: {
      id: raw.id,
      name,
      email: raw.email,
      avatar: raw.avatar_url || avatar(raw.id),
      role,
    },
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}

export async function login(input: LoginInput): Promise<PortalAuthResult> {
  const session = await authApi.login(input);
  return toPortalAuthResult(session);
}

export async function loginWithGoogleCode(code: string): Promise<PortalAuthResult> {
  const session = await authApi.exchangeGoogleCode({ code });
  return toPortalAuthResult(session);
}

export async function register(input: SignupInput): Promise<PortalAuthResult> {
  const session = await authApi.register({
    role: input.role === "client" ? "customer" : "photographer",
    fullname: input.name,
    email: input.email,
    password: input.password,
  });
  return toPortalAuthResult(session);
}
