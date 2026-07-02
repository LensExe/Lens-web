import { useState } from "react";
import { Loader2, UserPlus, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  formatPrice,
  toast,
} from "@lens/ui";
import { usePhotographers } from "@/queries/usePhotographers";
import { useInviteCollaborator } from "@/queries/useCollaborations";
import { photographerPayout } from "@/lib/booking";
import type { Booking, BookingCollaborator } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

const STATUS_META: Record<
  BookingCollaborator["status"],
  { label: string; className: string }
> = {
  invited: {
    label: "Đang mời",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  accepted: {
    label: "Đã đồng ý",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  declined: {
    label: "Đã từ chối",
    className: "bg-muted text-muted-foreground",
  },
};

export function CollaboratorDialog({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [share, setShare] = useState("");
  const { data: roster = [] } = usePhotographers();
  const invite = useInviteCollaborator(booking.id);

  const collaborators = booking.collaborators ?? [];
  const usedPct = collaborators.reduce((s, c) => s + c.sharePct, 0);
  const mainPct = Math.max(0, 100 - usedPct);
  const net = photographerPayout(booking.price);

  // Roster options: exclude self + already-invited.
  const taken = new Set([
    booking.photographerId,
    ...collaborators.map((c) => c.photographerId),
  ]);
  const options = roster.filter((p) => !taken.has(p.id));

  const shareNum = Number(share.replace(/\D/g, ""));
  const invalid = !pick || shareNum <= 0 || shareNum > mainPct;

  const submit = () => {
    if (invalid) return;
    const chosen = roster.find((p) => p.id === pick);
    if (!chosen) return;
    invite.mutate(
      {
        photographerId: chosen.id,
        photographerName: chosen.name,
        photographerAvatar: chosen.avatar,
        sharePct: shareNum,
      },
      {
        onSuccess: () => {
          toast.success(`Đã gửi lời mời tới ${chosen.name}`);
          setPick("");
          setShare("");
        },
        onError: () => toast.error("Không thể gửi lời mời, vui lòng thử lại"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Users className="size-4" />
          Liên kết thợ
          {collaborators.length > 0 && ` (${collaborators.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Liên kết thợ cho buổi chụp</DialogTitle>
          <DialogDescription>
            Mời thợ khác cùng tham gia và chia tiền theo tỷ lệ đã thoả thuận. Tất
            cả phải đồng ý trước khi buổi chụp diễn ra.
          </DialogDescription>
        </DialogHeader>

        {/* Current split */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Chia tiền (trên {formatPrice(net)} sau phí sàn)</p>
          <div className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
            <span className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback>{initialsOf(booking.photographerName)}</AvatarFallback>
              </Avatar>
              {booking.photographerName} (bạn)
            </span>
            <span className="font-semibold">
              {mainPct}% · {formatPrice(Math.round((net * mainPct) / 100))}
            </span>
          </div>
          {collaborators.map((c) => {
            const meta = STATUS_META[c.status];
            return (
              <div
                key={c.photographerId}
                className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={c.photographerAvatar} alt={c.photographerName} />
                    <AvatarFallback>{initialsOf(c.photographerName)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate">{c.photographerName}</span>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                        meta.className
                      )}
                    >
                      {meta.label}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {c.sharePct}% · {formatPrice(Math.round((net * c.sharePct) / 100))}
                </span>
              </div>
            );
          })}
        </div>

        {/* Invite form */}
        {mainPct > 0 && options.length > 0 ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium">
              Mời thêm thợ (còn {mainPct}% có thể chia)
            </p>
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhiếp ảnh gia" />
              </SelectTrigger>
              <SelectContent>
                {options.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                placeholder={`Tỷ lệ % (tối đa ${mainPct})`}
                value={share}
                onChange={(e) => setShare(e.target.value)}
              />
              <Button
                className="shrink-0 rounded-full"
                disabled={invalid || invite.isPending}
                onClick={submit}
              >
                {invite.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Mời
              </Button>
            </div>
            {shareNum > mainPct && (
              <p className="text-sm text-destructive">
                Tỷ lệ vượt quá phần còn lại ({mainPct}%).
              </p>
            )}
          </div>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            {mainPct <= 0
              ? "Đã chia hết 100%. Bỏ bớt thợ nếu muốn mời người khác."
              : "Không còn thợ nào để mời."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
