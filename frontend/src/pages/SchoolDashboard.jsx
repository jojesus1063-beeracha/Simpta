import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 font-display text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

const SchoolDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/school/dashboard").then((res) => setStats(res.data));
  }, []);

  if (!stats) {
    return (
      <Layout title="Overview">
        <p className="text-slate-400">Loading…</p>
      </Layout>
    );
  }

  return (
    <Layout title="Overview">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Teachers" value={stats.totalTeachers} />
        <StatCard label="Students" value={stats.totalStudents} />
        <StatCard label="Classes" value={stats.totalClasses} />
        <StatCard label="Attendance marked today" value={stats.attendanceMarkedToday} />
        <StatCard label="Present today" value={stats.presentToday} />
      </div>
    </Layout>
  );
};

export default SchoolDashboard;
