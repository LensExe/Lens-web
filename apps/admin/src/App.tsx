import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Overview } from "@/routes/Overview";
import { Photographers } from "@/routes/Photographers";
import { Users } from "@/routes/Users";
import { Reports } from "@/routes/Reports";
import { Placeholder } from "@/components/Placeholder";

function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="photographers" element={<Photographers />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Placeholder title="Không tìm thấy trang" description="Trang bạn tìm không tồn tại." />} />
      </Route>
    </Routes>
  );
}

export default App;
