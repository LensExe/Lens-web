import { lazy, type ComponentType } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PortalLayout } from "@/components/PortalLayout";
import { MessagesLayout } from "@/components/messages/MessagesLayout";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireRole } from "@/components/RequireRole";
import { BrowseGate } from "@/components/BrowseGate";
import { Photographers } from "@/routes/Photographers";
import { PhotographerProfile } from "@/routes/PhotographerProfile";
import { BookingFlow } from "@/routes/customer/BookingFlow";
import { Placeholder } from "@/components/Placeholder";
import { Login } from "@/routes/Login";
import { Signup } from "@/routes/Signup";

// Signed-in pages are code-split per workspace, so a customer never downloads the
// photographer studio (and vice versa). Public discovery pages stay eager.
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, key: K) =>
  lazy(() => load().then((m) => ({ default: m[key] })));

const CustomerOverview = page(() => import("@/routes/customer/Overview"), "CustomerOverview");
const CustomerBookings = page(() => import("@/routes/customer/Bookings"), "CustomerBookings");
const CustomerPayment = page(() => import("@/routes/customer/Payment"), "CustomerPayment");
const CustomerDeposit = page(() => import("@/routes/customer/Deposit"), "CustomerDeposit");
const CustomerReviews = page(() => import("@/routes/customer/Reviews"), "CustomerReviews");
const PhotographerOverview = page(() => import("@/routes/photographer/Overview"), "PhotographerOverview");
const PhotographerBookings = page(() => import("@/routes/photographer/Bookings"), "PhotographerBookings");
const PhotographerPortfolio = page(() => import("@/routes/photographer/Portfolio"), "PhotographerPortfolio");
const PhotographerPackages = page(() => import("@/routes/photographer/Packages"), "PhotographerPackages");
const PhotographerAvailability = page(() => import("@/routes/photographer/Availability"), "PhotographerAvailability");
const PhotographerAchievements = page(() => import("@/routes/photographer/Achievements"), "PhotographerAchievements");
const PhotographerStorage = page(() => import("@/routes/photographer/Storage"), "PhotographerStorage");
const PhotographerAssistant = page(() => import("@/routes/photographer/Assistant"), "PhotographerAssistant");
const Messages = page(() => import("@/routes/shared/Messages"), "Messages");
const Wallet = page(() => import("@/routes/shared/Wallet"), "Wallet");
const SettingsLayout = page(() => import("@/routes/shared/settings/SettingsLayout"), "SettingsLayout");
const ProfileSettings = page(() => import("@/routes/shared/settings/ProfileSettings"), "ProfileSettings");
const AccountSettings = page(() => import("@/routes/shared/settings/AccountSettings"), "AccountSettings");
const NotificationSettings = page(
  () => import("@/routes/shared/settings/NotificationSettings"),
  "NotificationSettings"
);
const CustomerBookingDetail = page(
  () => import("@/routes/customer/BookingDetail"),
  "CustomerBookingDetail"
);
const PhotographerBookingDetail = page(
  () => import("@/routes/photographer/BookingDetail"),
  "PhotographerBookingDetail"
);
const CustomerDeliveryGallery = page(
  () => import("@/routes/customer/DeliveryGallery"),
  "CustomerDeliveryGallery"
);
const PhotographerDeliveryGallery = page(
  () => import("@/routes/photographer/DeliveryGallery"),
  "PhotographerDeliveryGallery"
);

function App() {
  return (
    <div className="portal-theme min-h-dvh bg-background text-foreground">
      <Routes>
      {/* Authentication lives in the portal; landing redirects here. */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      {/* Public discovery (guests welcome) — browse is the default route */}
      <Route element={<PublicLayout />}>
        <Route element={<BrowseGate />}>
          <Route index element={<Photographers />} />
        </Route>
        <Route path="photographers" element={<Navigate to="/" replace />} />
            <Route path="photographers/:photographer_id" element={<PhotographerProfile />} />
        {/* Booking needs a customer account — guests go to login and come back */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={["client"]} />}>
            <Route path="photographers/:photographer_id/book" element={<BookingFlow />} />
          </Route>
        </Route>
      </Route>

      {/* Signed-in workspaces — guests are sent to login */}
      <Route element={<RequireAuth />}>
        {/* Messaging gets the whole screen (own top bar, no sidebar) */}
        <Route element={<MessagesLayout />}>
          <Route path="messages" element={<Messages />} />
        </Route>

        <Route element={<PortalLayout />}>
          {/* Customer workspace (runtime role: client) */}
          <Route element={<RequireRole allow={["client"]} />}>
            <Route path="client" element={<CustomerOverview />} />
            <Route path="client/bookings" element={<CustomerBookings />} />
            <Route path="client/bookings/:booking_id" element={<CustomerBookingDetail />} />
            <Route path="client/bookings/:booking_id/deposit" element={<CustomerDeposit />} />
            <Route path="client/bookings/:booking_id/pay" element={<CustomerPayment />} />
            <Route
              path="client/bookings/:booking_id/gallery"
              element={<CustomerDeliveryGallery />}
            />
            <Route path="client/reviews" element={<CustomerReviews />} />
          </Route>

          {/* Photographer studio */}
          <Route element={<RequireRole allow={["photographer"]} />}>
            <Route path="dashboard" element={<PhotographerOverview />} />
            <Route path="dashboard/portfolio" element={<PhotographerPortfolio />} />
            <Route path="dashboard/packages" element={<PhotographerPackages />} />
            <Route path="dashboard/availability" element={<PhotographerAvailability />} />
            <Route path="dashboard/achievements" element={<PhotographerAchievements />} />
            <Route path="dashboard/storage" element={<PhotographerStorage />} />
            <Route path="dashboard/assistant" element={<PhotographerAssistant />} />
            <Route path="dashboard/bookings" element={<PhotographerBookings />} />
            <Route
              path="dashboard/bookings/:booking_id"
              element={<PhotographerBookingDetail />}
            />
            <Route
              path="dashboard/bookings/:booking_id/gallery"
              element={<PhotographerDeliveryGallery />}
            />
          </Route>

          {/* Shared by both roles */}
          <Route path="wallet" element={<Wallet />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
          </Route>
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<Placeholder title="Không tìm thấy trang" description="Trang bạn tìm không tồn tại." />} />
      </Route>
      </Routes>
    </div>
  );
}

export default App;
