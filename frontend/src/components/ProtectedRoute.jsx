import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceLocked from "./WorkspaceLocked";

const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { user, companyStatus, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (superAdminOnly && !user.isSuperAdmin) return <Navigate to="/tasks" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/tasks" replace />;

  if (!user.isSuperAdmin && !superAdminOnly && companyStatus) {
    const now = new Date();
    const inTrial = companyStatus.licenseStatus === "trial" && new Date(companyStatus.trialEndsAt) > now;
    const active = companyStatus.licenseStatus === "active" || inTrial;
    if (!active) return <WorkspaceLocked />;
  }

  return children;
};

export default ProtectedRoute;
