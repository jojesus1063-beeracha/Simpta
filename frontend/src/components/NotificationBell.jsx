import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const POLL_INTERVAL_MS = 30000;

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const loadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setCount(res.data.count);
    } catch {
      // ignore - e.g. not logged in yet
    }
  };

  useEffect(() => {
    loadCount();
    const timer = setInterval(loadCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    }
  };

  const handleClick = async (n) => {
    await api.patch(`/notifications/${n._id}/read`);
    setOpen(false);
    loadCount();
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative rounded-lg p-2 hover:bg-slate-100">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {notifications.some((n) => !n.read) && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-teal-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                  n.read ? "text-slate-500" : "font-medium text-slate-800"
                }`}
              >
                <p>{n.message}</p>
                <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
              </button>
            ))}
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
