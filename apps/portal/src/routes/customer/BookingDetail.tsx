import { BookingDetailPage } from "@/components/bookings/BookingDetailPage";

/** Customer booking detail entry point. The shared view owns the presentation. */
export function CustomerBookingDetail() {
  return <BookingDetailPage mode="client" />;
}
