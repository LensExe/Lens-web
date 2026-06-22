import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { Landing } from "@/routes/Landing";
import { Login } from "@/routes/Login";
import { Signup } from "@/routes/Signup";
import { Placeholder } from "@/routes/Placeholder";

// Landing app = public marketing + auth only. After login, users are
// redirected to the Portal (client/photographer) or Admin app.
function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Marketing */}
        <Route index element={<Landing />} />

        {/* Auth */}
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* 404 */}
        <Route path="*" element={<Placeholder title="Không tìm thấy trang" description="Trang bạn tìm không tồn tại hoặc đã được di chuyển." />} />
      </Route>
    </Routes>
  );
}

export default App;
