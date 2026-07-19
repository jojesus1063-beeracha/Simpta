import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
    productType: "tasks",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.companyName, form.productType);
      navigate(form.productType === "school" ? "/school" : "/tasks");
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
            Set up your workspace in under a minute.
          </p>
          <p className="text-sm text-teal-100/70">
            One platform, built for how your team or school actually works.
          </p>
        </div>
        <p className="text-xs text-teal-100/40">Simpta {new Date().getFullYear()}</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-8 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo light />
          </div>
          <h1 className="mb-1 font-display text-2xl font-bold text-slate-900">Create your workspace</h1>
          <p className="mb-6 text-sm text-slate-500">
            You'll be the admin — invite your team once you're in.
          </p>

          {error && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">What are you setting up?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, productType: "tasks" })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    form.productType === "tasks"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Task Manager
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, productType: "school" })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    form.productType === "school"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  School Management
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {form.productType === "school" ? "School name" : "Company name"}
              </label>
              <input
                required
                placeholder={form.productType === "school" ? "Greenwood High School" : "Acme Inc."}
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Your name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
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
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Creating workspace…" : "Create workspace"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-teal-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
