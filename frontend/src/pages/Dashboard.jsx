import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const STATUS_COLORS = { pending: "#94A3B8", "in-progress": "#F59E0B", completed: "#0D9488" };
const PRIORITY_COLORS = { low: "#94A3B8", medium: "#F59E0B", high: "#E11D48" };

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-1 font-display text-3xl font-bold ${accent || "text-slate-900"}`}>{value}</p>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/tasks/analytics/summary").then((res) => setData(res.data));
  }, []);

  if (!data) {
    return (
      <Layout title="Overview">
        <p className="text-slate-400">Loading analytics…</p>
      </Layout>
    );
  }

  const statusData = data.byStatus.map((s) => ({ name: s._id, value: s.count }));
  const priorityData = data.byPriority.map((p) => ({ name: p._id, value: p.count }));
  const userData = data.byUser.map((u) => ({ name: u.name, assigned: u.count, completed: u.completed }));
  const completed = data.byStatus.find((s) => s._id === "completed")?.count || 0;
  const completionRate = data.total ? Math.round((completed / data.total) * 100) : 0;

  return (
    <Layout title="Overview">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total tasks" value={data.total} />
        <StatCard label="Completed" value={completed} accent="text-teal-600" />
        <StatCard label="Overdue" value={data.overdue} accent="text-rose-600" />
        <StatCard label="Completion rate" value={`${completionRate}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-display text-sm font-bold text-slate-900">Tasks by status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#CBD5E1"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs text-slate-500">
            {statusData.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 capitalize">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-display text-sm font-bold text-slate-900">Tasks by priority</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || "#CBD5E1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-sm font-bold text-slate-900">Workload by teammate</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={userData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="assigned" name="Assigned" fill="#94A3B8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#0D9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
