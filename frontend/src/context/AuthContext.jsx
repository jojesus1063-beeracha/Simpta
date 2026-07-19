import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AuthContext = createContext(null);
const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes, web only

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [companyStatus, setCompanyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const inactivityTimer = useRef(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setCompanyStatus(res.data.companyStatus);
      })
      .catch(() => sessionStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    sessionStorage.removeItem("token");
    setUser(null);
    setCompanyStatus(null);
  };

  // 10-minute inactivity auto-logout, web only. Any mouse/keyboard/touch
  // activity resets the timer. This never runs for the native app.
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        logout();
        navigate("/login?reason=inactivity");
      }, INACTIVITY_LIMIT_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password, platform: "web" });
    sessionStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    setCompanyStatus(res.data.companyStatus);
    return { user: res.data.user, companyStatus: res.data.companyStatus };
  };

  const register = async (name, email, password, companyName, productType) => {
    const res = await api.post("/auth/register", { name, email, password, companyName, productType, platform: "web" });
    sessionStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    setCompanyStatus(res.data.companyStatus);
    return { user: res.data.user, companyStatus: res.data.companyStatus };
  };

  return (
    <AuthContext.Provider value={{ user, companyStatus, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
