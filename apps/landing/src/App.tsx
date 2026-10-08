import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { Landing } from "@/routes/Landing";
import { Placeholder } from "@/routes/Placeholder";
import { PortalAuthRedirect } from "@/routes/PortalAuthRedirect";

// Landing app = public marketing only. Authentication lives in the Portal;
// the legacy auth paths below keep old bookmarks/links working while sending
// visitors to the Portal app.
function App() {
  return (
    <Routes>
      <Route path="login" element={<PortalAuthRedirect path="login" />} />
      <Route path="signup" element={<PortalAuthRedirect path="signup" />} />

      <Route element={<RootLayout />}>
        {/* Marketing */}
        <Route index element={<Landing />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <Placeholder
              title="Không tìm thấy trang"
              description="Trang bạn tìm không tồn tại hoặc đã được di chuyển."
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
