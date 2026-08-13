import Sidebar from "./Sidebar.jsx";
import { useIdleLogout } from "../context/useIdleLogout.js";

export default function Layout({ children }) {
  useIdleLogout();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}
