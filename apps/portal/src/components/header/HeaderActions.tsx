import { ThemeToggle } from "@lens/ui";
import { MessagesMenu } from "@/components/header/MessagesMenu";
import { AccountMenu } from "@/components/header/AccountMenu";

/** Shared right-side header cluster used by both layouts: theme toggle,
 *  messages (badge + hover preview), and the account menu (avatar + balances). */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <MessagesMenu />
      <AccountMenu />
    </div>
  );
}
