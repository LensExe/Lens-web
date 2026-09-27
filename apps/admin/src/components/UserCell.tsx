import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@lens/ui";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

/** Avatar + name (+ a muted second line) — the first column of most tables. */
export function UserCell({
  name,
  avatar,
  sub,
}: {
  name: string;
  avatar?: string;
  sub?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-10 shrink-0">
        {avatar && <AvatarImage src={avatar} alt={name} />}
        <AvatarFallback>{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium leading-tight">{name}</p>
        {/* Text subs truncate; a control (e.g. a tooltip trigger) keeps its focus ring. */}
        {typeof sub === "string" ? (
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        ) : (
          sub && <div className="text-xs text-muted-foreground">{sub}</div>
        )}
      </div>
    </div>
  );
}
