import { Bell, CheckCheck } from "lucide-react";
import { Button, CountBadge, Popover, PopoverContent, PopoverTrigger, toast } from "@lens/ui";
import { formatRelative } from "@/lib/time";
import { useMarkAllNotificationsRead, useNotifications } from "@/queries/useNotifications";

const TYPE_LABEL: Record<string, string> = {
  welcome: "Chào mừng",
  order_placed: "Đặt lịch",
  payment_success: "Thanh toán",
  promotion_started: "Ưu đãi",
};

export function NotificationsMenu() {
  const { data: notifications = [], isLoading, isError } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="relative rounded-full" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`}>
          <Bell />
          <CountBadge count={unreadCount} onIcon className="absolute -right-1 -top-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-semibold">Thông báo</h2>
            <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} chưa đọc` : "Đã cập nhật"}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg px-2 text-xs"
            disabled={!unreadCount || markAll.isPending}
            onClick={() => markAll.mutate(undefined, { onError: () => toast.error("Không cập nhật được thông báo." ) })}
          >
            <CheckCheck className="size-3.5" />
            Đọc tất cả
          </Button>
        </div>
        <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
          {isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Đang tải thông báo…</p>
          ) : isError ? (
            <p role="alert" className="p-6 text-center text-sm text-destructive">Không tải được thông báo. Kiểm tra cấu hình Notification Service.</p>
          ) : notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Bạn chưa có thông báo nào.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((item) => (
                <li key={item.id} className={`px-4 py-3 ${item.isRead ? "" : "bg-muted/35"}`}>
                  <div className="flex items-start gap-2.5">
                    {!item.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ember" aria-label="Chưa đọc" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
                      <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-muted-foreground">{TYPE_LABEL[item.type] ?? item.type}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
