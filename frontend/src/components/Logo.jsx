import React from "react";

const Logo = ({ size = "md", light = false, compact = false }) => {
  const dims = size === "lg" ? { icon: 36, text: "text-xl" } : { icon: 26, text: "text-base" };

  return (
    <div className="flex items-center gap-2">
      <svg width={dims.icon} height={dims.icon} viewBox="0 0 30 30" className="shrink-0">
        <rect x="1" y="1" width="28" height="28" rx="8" fill="#0d9488" />
        <path
          d="M8.5 15.5l4 4 9-9"
          stroke={light ? "#0F2E28" : "#ffffff"}
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`font-display font-bold tracking-tight ${dims.text} ${light ? "text-slate-900" : "text-white"}`}>
        {compact ? (
          <>
            Simpta <span className="text-teal-500">TM</span>
          </>
        ) : (
          <>
            Simpta <span className="text-teal-500">Task Manager</span>
          </>
        )}
      </span>
    </div>
  );
};

export default Logo;
