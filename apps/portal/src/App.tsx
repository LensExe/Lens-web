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
import { BookingFlow } from "@/routes/BookingFlow";
import { Placeholder } from "@/components/Placeholder";
import { Login } from "@/routes/Login";
import { Signup } from "@/routes/Signup";

// Signed-in pages are code-split per workspace, so a client never downloads the
// photographer studio (and vice versa). Public discovery pages stay eager.
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, key: K) =>
  lazy(() => load().then((m) => ({ default: m[key] })));

const ClientOverview = page(() => import("@/routes/client/Overview"), "ClientOverview");
const ClientBookings = page(() => import("@/routes/client/Bookings"), "ClientBookings");
const ClientPayment = page(() => import("@/routes/client/Payment"), "ClientPayment");
const ClientDeposit = page(() => import("@/routes/client/Deposit"), "ClientDeposit");
const ClientReviews = page(() => import("@/routes/client/Reviews"), "ClientReviews");
const DashboardOverview = page(() => import("@/routes/dashboard/Overview"), "DashboardOverview");
const DashboardBookings = page(() => import("@/routes/dashboard/Bookings"), "DashboardBookings");
const DashboardPortfolio = page(() => import("@/routes/dashboard/Portfolio"), "DashboardPortfolio");
const DashboardPackages = page(() => import("@/routes/dashboard/Packages"), "DashboardPackages");
const DashboardAvailability = page(() => import("@/routes/dashboard/Availability"), "DashboardAvailability");
const DashboardAchievements = page(() => import("@/routes/dashboard/Achievements"), "DashboardAchievements");
const DashboardStorage = page(() => import("@/routes/dashboard/Storage"), "DashboardStorage");
const DashboardAssistant = page(() => import("@/routes/dashboard/Assistant"), "DashboardAssistant");
const Messages = page(() => import("@/routes/Messages"), "Messages");
const Wallet = page(() => import("@/routes/Wallet"), "Wallet");
const SettingsLayout = page(() => import("@/routes/settings/SettingsLayout"), "SettingsLayout");
const ProfileSettings = page(() => import("@/routes/settings/ProfileSettings"), "ProfileSettings");
const AccountSettings = page(() => import("@/routes/settings/AccountSettings"), "AccountSettings");
const NotificationSettings = page(
  () => import("@/routes/settings/NotificationSettings"),
  "NotificationSettings"
);
// Pages with props.
const BookingDetail = lazy(() =>
  import("@/routes/BookingDetail").then((m) => ({ default: m.BookingDetail }))
);
const DeliveryGallery = lazy(() =>
  import("@/routes/DeliveryGallery").then((m) => ({ default: m.DeliveryGallery }))
);

function App() {
  return (
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
        <Route path="photographers/:id" element={<PhotographerProfile />} />
        {/* Booking needs a client account — guests go to login and come back */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={["client"]} />}>
            <Route path="photographers/:id/book" element={<BookingFlow />} />
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
          {/* Client workspace */}
          <Route element={<RequireRole allow={["client"]} />}>
            <Route path="client" element={<ClientOverview />} />
            <Route path="client/bookings" element={<ClientBookings />} />
            <Route path="client/bookings/:id" element={<BookingDetail mode="client" />} />
            <Route path="client/bookings/:id/deposit" element={<ClientDeposit />} />
            <Route path="client/bookings/:id/pay" element={<ClientPayment />} />
            <Route
              path="client/bookings/:id/gallery"
              element={<DeliveryGallery mode="client" />}
            />
            <Route path="client/reviews" element={<ClientReviews />} />
          </Route>

          {/* Photographer studio */}
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
  );
}

export default App;
