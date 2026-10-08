import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Login } from "@/routes/Login";
import { Overview } from "@/routes/Overview";
import { Photographers } from "@/routes/Photographers";
import { ApplicationReview } from "@/routes/ApplicationReview";
import { Users } from "@/routes/Users";
import { Reports } from "@/routes/Reports";
import { Finance } from "@/routes/Finance";
import { Bookings } from "@/routes/Bookings";
import { Storage } from "@/routes/Storage";
import { Quality } from "@/routes/Quality";
import { Placeholder } from "@/components/Placeholder";

function App() {
  return (
    <Routes>
      {/* The console's own sign-in — never linked from the public site. */}
      <Route path="login" element={<Login />} />

      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Overview />} />
        <Route path="photographers" element={<Photographers />} />
        <Route path="photographers/:id" element={<ApplicationReview />} />
        <Route path="users" element={<Users />} />
        <Route path="finance" element={<Finance />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="storage" element={<Storage />} />
        <Route path="quality" element={<Quality />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Placeholder title="Không tìm thấy trang" description="Trang bạn tìm không tồn tại." />} />
      </Route>
    </Routes>
  );
}

export default App;
