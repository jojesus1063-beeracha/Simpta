import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

// sessionStorage (not localStorage) is used deliberately: it's automatically
// cleared when the browser tab is closed, which is how we satisfy "sign out
// immediately when the tab is closed" without any extra logic.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If this account logged in elsewhere on the same platform, the server
// rejects this session's token. Force a clean logout and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.data?.code === "SESSION_INVALIDATED") {
      sessionStorage.removeItem("token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?reason=session_invalidated";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
