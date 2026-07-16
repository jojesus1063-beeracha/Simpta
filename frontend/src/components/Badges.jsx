import React from "react";

const statusStyles = {
  pending: "bg-slate-100 text-slate-600",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-teal-100 text-teal-700",
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-500",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

export const StatusBadge = ({ status }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[status] || statusStyles.pending}`}>
    {status}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${priorityStyles[priority] || priorityStyles.medium}`}>
    {priority}
  </span>
);
