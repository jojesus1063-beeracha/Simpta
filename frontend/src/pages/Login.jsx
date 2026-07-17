import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/tasks");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full font-body">
      <div className="hidden flex-1 flex-col justify-between bg-ink p-10 text-white lg:flex">
        <Logo size="lg" />
        <div>
          <p className="mb-2 font-display text-2xl font-bold leading-snug">
            Assign work. Track progress. Stay in sync.
          </p>
          <p className="text-sm text-teal-100/70">
            One place for your team's tasks, deadlines, and updates.
          </p>
        </div>
        <p className="text-xs text-teal-100/40">Simpta Task Manager {new Date().getFullYear()}</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo light />
          </div>
          <h1 className="mb-1 font-display text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mb-6 text-sm text-slate-500">Log in to your account.</p>

          {error && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to Simpta?{" "}
            <Link to="/register" className="font-medium text-teal-600 hover:underline">
              Create your workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
