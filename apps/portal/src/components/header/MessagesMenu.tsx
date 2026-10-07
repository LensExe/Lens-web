import { MessageSquare } from "lucide-react";
import { Button } from "@lens/ui";

export function MessagesMenu() {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="rounded-full"
      disabled
      title="Backend chưa có API tin nhắn."
      aria-label="Tin nhắn chưa được backend hỗ trợ"
    >
      <MessageSquare />
    </Button>
  );
}
