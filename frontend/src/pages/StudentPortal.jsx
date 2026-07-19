import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const statusStyles = {
  present: "bg-teal-100 text-teal-700",
  absent: "bg-rose-100 text-rose-700",
  late: "bg-amber-100 text-amber-700",
};

const StudentPortal = () => {
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get("/students/me").then((res) => {
      setProfile(res.data);
      api.get(`/attendance/student/${res.data._id}`).then((r) => setRecords(r.data));
    });
  }, []);

  return (
    <Layout title="My profile">
      {profile && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900">{profile.name}</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">Class</dt>
              <dd className="text-slate-700">{profile.class ? `${profile.class.name}${profile.class.section ? " - " + profile.class.section : ""}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Roll number</dt>
              <dd className="text-slate-700">{profile.rollNumber || "—"}</dd>
            </div>
          </dl>
        </div>
      )}

      <h3 className="mb-3 font-display text-base font-bold text-slate-900">Attendance history</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r._id}>
                <td className="px-4 py-3 text-slate-700">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[r.status]}`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-400">No attendance recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default StudentPortal;
