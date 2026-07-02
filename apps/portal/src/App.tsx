import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { PortalLayout } from "@/components/PortalLayout";
import { RequireRole } from "@/components/RequireRole";
import { Photographers } from "@/routes/Photographers";
import { PhotographerProfile } from "@/routes/PhotographerProfile";
import { BookingFlow } from "@/routes/BookingFlow";
import { ClientOverview } from "@/routes/client/Overview";
import { ClientBookings } from "@/routes/client/Bookings";
import { ClientPayment } from "@/routes/client/Payment";
import { ClientReviews } from "@/routes/client/Reviews";
import { DashboardOverview } from "@/routes/dashboard/Overview";
import { DashboardBookings } from "@/routes/dashboard/Bookings";
import { DashboardPortfolio } from "@/routes/dashboard/Portfolio";
import { DashboardPackages } from "@/routes/dashboard/Packages";
import { DashboardAvailability } from "@/routes/dashboard/Availability";
import { DashboardAchievements } from "@/routes/dashboard/Achievements";
import { DashboardStorage } from "@/routes/dashboard/Storage";
import { DashboardAssistant } from "@/routes/dashboard/Assistant";
import { DeliveryGallery } from "@/routes/DeliveryGallery";
import { BookingDetail } from "@/routes/BookingDetail";
import { Messages } from "@/routes/Messages";
import { Wallet } from "@/routes/Wallet";
import { Placeholder } from "@/components/Placeholder";

function App() {
  return (
    <Routes>
      {/* Public discovery (no login) — browse is the default route */}
      <Route element={<PublicLayout />}>
        <Route index element={<Photographers />} />
        <Route path="photographers/:id" element={<PhotographerProfile />} />
        <Route path="photographers/:id/book" element={<BookingFlow />} />
      </Route>

      {/* Signed-in app (client + photographer) — reached via the avatar menu */}
      <Route element={<PortalLayout />}>
        {/* Client area — visible to both clients and photographers */}
        <Route path="client" element={<ClientOverview />} />
        <Route path="client/bookings" element={<ClientBookings />} />
        <Route path="client/bookings/:id" element={<BookingDetail mode="client" />} />
        <Route path="client/bookings/:id/pay" element={<ClientPayment />} />
        <Route
          path="client/bookings/:id/gallery"
          element={<DeliveryGallery mode="client" />}
        />
        <Route path="client/reviews" element={<ClientReviews />} />

        {/* Photographer area — photographers only */}
        <Route element={<RequireRole allow={["photographer"]} />}>
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="dashboard/portfolio" element={<DashboardPortfolio />} />
          <Route path="dashboard/packages" element={<DashboardPackages />} />
          <Route path="dashboard/availability" element={<DashboardAvailability />} />
          <Route path="dashboard/achievements" element={<DashboardAchievements />} />
          <Route path="dashboard/storage" element={<DashboardStorage />} />
          <Route path="dashboard/assistant" element={<DashboardAssistant />} />
          <Route path="dashboard/bookings" element={<DashboardBookings />} />
          <Route
            path="dashboard/bookings/:id"
            element={<BookingDetail mode="photographer" />}
          />
          <Route
            path="dashboard/bookings/:id/gallery"
            element={<DeliveryGallery mode="photographer" />}
          />
        </Route>

        {/* Shared */}
        <Route path="messages" element={<Messages />} />
        <Route path="wallet" element={<Wallet />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<Placeholder title="Không tìm thấy trang" description="Trang bạn tìm không tồn tại." />} />
      </Route>
    </Routes>
  );
}

export default App;
