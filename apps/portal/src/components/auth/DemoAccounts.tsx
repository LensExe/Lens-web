import { Camera, UserRound } from "lucide-react";
import { useDemoAccounts } from "@/queries/useAuth";
import { ROLE_LABELS } from "@/lib/auth";
import type { DemoAccount, PortalRole } from "@/types";

const ROLE_ICONS: Record<PortalRole, typeof Camera> = {
  client: UserRound,
  photographer: Camera,
};

export function DemoAccounts({ onPick }: { onPick: (account: DemoAccount) => void }) {
  const { data } = useDemoAccounts();
  if (!data?.length) return null;

  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <p className="text-xs text-muted-foreground">Tài khoản demo — bấm để điền nhanh</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {data.map((account) => {
          const Icon = ROLE_ICONS[account.role];
          return (
            <button
              key={account.email}
              type="button"
              onClick={() => onPick(account)}
              className="focus-ring flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{ROLE_LABELS[account.role]}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {account.email}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
