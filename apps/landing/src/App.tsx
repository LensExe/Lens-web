import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Landing } from "@/routes/Landing";
import { Login } from "@/routes/Login";
import { Signup } from "@/routes/Signup";
import { Placeholder } from "@/routes/Placeholder";

// Landing app = public marketing + auth only. After login, users are
// redirected to their home in the Portal (client/photographer). Admins sign in
// on the admin app itself.
function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Marketing */}
        <Route index element={<Landing />} />

        {/* 404 */}
        <Route path="*" element={<Placeholder title="Không tìm thấy trang" description="Trang bạn tìm không tồn tại hoặc đã được di chuyển." />} />
      </Route>

      {/* Auth — own layout, no marketing navbar */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>
    </Routes>
  );
}

export default App;
