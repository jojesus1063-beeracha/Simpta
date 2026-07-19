import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const TeacherPortal = () => {
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get("/teachers/me").then((res) => setProfile(res.data));
    api.get("/classes").then((res) => setClasses(res.data));
  }, []);

  return (
    <Layout title="My profile">
      {profile && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900">{profile.name}</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="text-slate-700">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Department</dt>
              <dd className="text-slate-700">{profile.department || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Subjects</dt>
              <dd className="text-slate-700">{profile.subjects?.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Qualification</dt>
              <dd className="text-slate-700">{profile.qualification || "—"}</dd>
            </div>
          </dl>
        </div>
      )}

      <h3 className="mb-3 font-display text-base font-bold text-slate-900">My classes</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Section</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classes.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.section || "—"}</td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-400">No classes assigned yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default TeacherPortal;
