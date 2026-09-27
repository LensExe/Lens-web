import { Link } from "react-router-dom";
import { CalendarDays, Pencil } from "lucide-react";
import { Button, cn } from "@lens/ui";
import { sessionUser } from "@/lib/session";

/**
 * The profile's primary CTA, aware of who is looking:
 * - guest / client → "Đặt lịch ngay" (guests are sent to login by the route guard)
 * - the photographer viewing their own profile → "Chỉnh sửa hồ sơ"
 * - another photographer → nothing (booking is for client accounts)
 */
export function BookButton({
  photographerId,
  size = "lg",
  className,
}: {
  photographerId: string;
  size?: "default" | "lg";
  className?: string;
}) {
  if (sessionUser?.id === photographerId) {
    return (
      <Button asChild size={size} variant="outline" className={cn("rounded-full", className)}>
        <Link to="/dashboard/portfolio">
          <Pencil className="size-4" />
          Chỉnh sửa hồ sơ
        </Link>
      </Button>
    );
  }
  if (sessionUser?.role === "photographer") return null;

  return (
    <Button
      asChild
      size={size}
      className={cn("rounded-full bg-ember px-5 text-white hover:bg-ember/90", className)}
    >
      <Link to={`/photographers/${photographerId}/book`}>
        <CalendarDays className="size-4" />
        Đặt lịch ngay
      </Link>
    </Button>
  );
}
