import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@lens/ui";
import { COLLAB_STATUS_META } from "@/lib/status";
import type { AdminCollaborator } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

/**
 * Collaborating photographers as a tiny avatar stack + "2 thợ ghép"; hover or
 * focus lists each one with their share and whether they accepted.
 */
export function CollaboratorStack({ collaborators }: { collaborators: AdminCollaborator[] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="focus-ring mt-1 inline-flex items-center gap-1.5 rounded-full text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <AvatarGroup className="-space-x-1.5 *:data-[slot=avatar]:ring-card">
            {collaborators.map((c) => (
              <Avatar key={c.name} className="size-5">
                {c.avatar && <AvatarImage src={c.avatar} alt="" />}
                <AvatarFallback className="text-[9px]">{initialsOf(c.name)}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          + {collaborators.length} thợ ghép
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="block px-3 py-2">
        <ul className="space-y-1">
          {collaborators.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-4">
              <span className="font-medium">{c.name}</span>
              <span className="tabular-nums text-background/70">
                {c.sharePct}% · {COLLAB_STATUS_META[c.status].label}
              </span>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
