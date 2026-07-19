import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [companyStatus, setCompanyStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
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
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    setCompanyStatus(res.data.companyStatus);
    return { user: res.data.user, companyStatus: res.data.companyStatus };
  };

  const register = async (name, email, password, companyName, productType) => {
    const res = await api.post("/auth/register", { name, email, password, companyName, productType });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    setCompanyStatus(res.data.companyStatus);
    return { user: res.data.user, companyStatus: res.data.companyStatus };
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCompanyStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, companyStatus, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
