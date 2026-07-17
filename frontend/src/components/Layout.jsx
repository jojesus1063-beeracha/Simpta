import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const navItem =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

const Layout = ({ title, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-body">
      <aside className="flex w-60 flex-col justify-between bg-ink px-4 py-6 text-slate-300">
        <div>
          <div className="mb-8 px-2">
            <Logo compact />
          </div>
          <nav className="space-y-1">
            {user?.role === "admin" && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${navItem} ${isActive ? "bg-slate-850 text-white" : "hover:bg-slate-850/60 hover:text-white"}`
                }
              >
                Overview
              </NavLink>
            )}
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `${navItem} ${isActive ? "bg-slate-850 text-white" : "hover:bg-slate-850/60 hover:text-white"}`
              }
            >
              {user?.role === "admin" ? "All tasks" : "My tasks"}
            </NavLink>
            {user?.role === "admin" && (
              <NavLink
                to="/team"
                className={({ isActive }) =>
                  `${navItem} ${isActive ? "bg-slate-850 text-white" : "hover:bg-slate-850/60 hover:text-white"}`
                }
              >
                Team
              </NavLink>
            )}
            {user?.isSuperAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${navItem} ${isActive ? "bg-slate-850 text-white" : "hover:bg-slate-850/60 hover:text-white"}`
                }
              >
                Platform Admin
              </NavLink>
            )}
          </nav>
        </div>
        <div className="border-t border-slate-700 pt-4">
          <p className="px-2 text-xs text-slate-400">Signed in as</p>
          <p className="px-2 text-sm font-medium text-white">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-850/60 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-slate-200 bg-white px-8 py-5">
          <h1 className="font-display text-xl font-bold text-slate-900">{title}</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
