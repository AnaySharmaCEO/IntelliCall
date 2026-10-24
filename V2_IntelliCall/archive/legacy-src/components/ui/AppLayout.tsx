import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Sidebar renders its own placeholder spacer + fixed overlay panel */}
      <Sidebar />

      {/* Main content — uses the remaining space after the icon-rail placeholder */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
