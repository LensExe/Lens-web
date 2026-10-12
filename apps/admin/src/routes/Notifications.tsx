import { useDeferredValue, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BellRing, Send } from "lucide-react";
import { Button, Input, PageContainer, PageHeader, toast } from "@lens/ui";
import { adminApi } from "@/services/backend";

const NOTIFICATION_TYPES = [
  { value: "welcome", label: "Chào mừng" },
  { value: "order_placed", label: "Đặt lịch" },
  { value: "payment_success", label: "Thanh toán thành công" },
  { value: "promotion_started", label: "Ưu đãi" },
] as const;

export function Notifications() {
  const [keyword, setKeyword] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<(typeof NOTIFICATION_TYPES)[number]["value"]>("welcome");
  const search = useDeferredValue(keyword.trim());
  const users = useQuery({
    queryKey: ["admin", "notification-recipients", search],
    queryFn: () => adminApi.listUsers({ limit: 100, offset: 0, status: "active", keyword: search || undefined }),
  });
  const send = useMutation({
    mutationFn: () => adminApi.sendNotification({ userId, title: title.trim(), message: message.trim(), type }),
    onSuccess: () => {
      toast.success("Đã gửi thông báo đến tài khoản đã chọn.");
      setTitle("");
      setMessage("");
    },
    onError: () => toast.error("Không gửi được thông báo. Hãy kiểm tra Notification Service và quyền admin."),
  });

  const recipients = (users.data?.items ?? []).flatMap((user) => {
    const keycloakId = typeof user.keycloak_id === "string" ? user.keycloak_id : "";
    if (!keycloakId) return [];
    const name = typeof user.fullname === "string" ? user.fullname : "Người dùng Lens";
    const email = typeof user.email === "string" ? user.email : "";
    return [{ id: keycloakId, label: email ? `${name} · ${email}` : name }];
  });

  const canSubmit = userId && title.trim() && message.trim() && !send.isPending;

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Gửi thông báo" description="Gửi một thông báo in-app đến tài khoản đã đăng ký trên Lens." />
      <form
        className="rounded-2xl border border-border bg-card p-5 sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) send.mutate();
        }}
      >
        <div className="flex items-start gap-3 border-b border-border pb-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><BellRing className="size-5" /></span>
          <div>
            <h2 className="font-semibold">Người nhận và nội dung</h2>
            <p className="mt-1 text-sm text-muted-foreground">Thông báo được lưu trong inbox và phát realtime nếu người nhận đang kết nối.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm font-medium">
            Tìm tài khoản đang hoạt động
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tên hoặc email" className="h-11 rounded-xl" />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Người nhận
            <select
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              disabled={users.isLoading}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">{users.isLoading ? "Đang tải tài khoản…" : "Chọn tài khoản"}</option>
              {recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.label}</option>)}
            </select>
            {users.isError && <span role="alert" className="text-xs text-destructive">Không tải được danh sách tài khoản.</span>}
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Loại thông báo
            <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {NOTIFICATION_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Tiêu đề
            <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required placeholder="Nhập tiêu đề thông báo" className="h-11 rounded-xl" />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Nội dung
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} required rows={5} placeholder="Nhập nội dung gửi đến người nhận" className="resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
        </div>

        <div className="mt-6 flex justify-end border-t border-border pt-5">
          <Button type="submit" className="rounded-xl" disabled={!canSubmit}>
            <Send className="size-4" />
            {send.isPending ? "Đang gửi…" : "Gửi thông báo"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
