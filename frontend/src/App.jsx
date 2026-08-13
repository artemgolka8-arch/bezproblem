import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Admin/Employees.jsx";
import Branches from "./pages/Branches.jsx";
import Clients from "./pages/Clients.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Debts from "./pages/Debts.jsx";

function Protected({ children, permission }) {
  const { token, loading, hasPermission } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Загрузка…</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) {
    return (
      <Layout>
        <div className="text-sm bg-rose-50 text-rose rounded-sm px-3 py-2 inline-block">
          У вас нет доступа к этому разделу.
        </div>
      </Layout>
    );
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected permission="dashboard.view"><Dashboard /></Protected>} />
      <Route path="/clients" element={<Protected permission="clients.view"><Clients /></Protected>} />
      <Route path="/vehicles" element={<Protected permission="vehicles.view"><Vehicles /></Protected>} />
      <Route path="/debts" element={<Protected permission="debts.view"><Debts /></Protected>} />
      <Route path="/maintenance" element={<Protected permission="maintenance.view"><Maintenance /></Protected>} />
      <Route path="/branches" element={<Protected permission="branches.view"><Branches /></Protected>} />
      <Route path="/admin/employees" element={<Protected permission="employees.view"><Employees /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
