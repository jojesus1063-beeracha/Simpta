import React from "react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const WorkspaceLocked = () => {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo light />
        </div>
        <h1 className="mb-2 font-display text-xl font-bold text-slate-900">Your trial has ended</h1>
        <p className="mb-6 text-sm text-slate-500">
          To keep using your workspace, please contact the workspace owner to activate your subscription.
        </p>
        <button
          onClick={logout}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default WorkspaceLocked;
