import { ThemeToggle } from "@lens/ui";
import { MessagesMenu } from "@/components/header/MessagesMenu";
import { AccountMenu } from "@/components/header/AccountMenu";
import { GuestActions } from "@/components/header/GuestActions";
import { isSignedIn } from "@/lib/session";

/** Shared right-side header cluster used by both layouts: theme toggle, then
 *  messages (badge + hover preview) + the account menu (avatar + balances) when
 *  signed in, or "Đăng nhập / Đăng ký" for a guest. */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      {isSignedIn ? (
        <>
          <MessagesMenu />
          <AccountMenu />
        </>
      ) : (
        <GuestActions />
      )}
    </div>
  );
}
