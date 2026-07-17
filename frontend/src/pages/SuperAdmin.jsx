import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const statusStyles = {
  trial: "bg-amber-100 text-amber-700",
  active: "bg-teal-100 text-teal-700",
  inactive: "bg-rose-100 text-rose-700",
};

const SuperAdmin = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    const res = await api.get("/superadmin/companies");
    setCompanies(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateCompany = async (id, changes) => {
    setSavingId(id);
    await api.patch(`/superadmin/companies/${id}`, changes);
    await load();
    setSavingId(null);
  };

  const handlePlanBlur = (id, value) => {
    updateCompany(id, { plan: value });
  };

  if (loading) {
    return (
      <Layout title="Platform Admin">
        <p className="text-slate-400">Loading companies…</p>
      </Layout>
    );
  }

  return (
    <Layout title="Platform Admin">
      <p className="mb-6 text-sm text-slate-500">
        Every company workspace signed up for Simpta. Activate or deactivate access, and set a plan name for your own records.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Admin contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trial ends</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">
                  {c.admin ? (
                    <>
                      <p>{c.admin.name}</p>
                      <p className="text-xs text-slate-400">{c.admin.email}</p>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[c.licenseStatus]}`}>
                    {c.licenseStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {c.trialEndsAt ? new Date(c.trialEndsAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={c.plan}
                    onBlur={(e) => handlePlanBlur(c.id, e.target.value)}
                    className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  {c.licenseStatus === "active" ? (
                    <button
                      disabled={savingId === c.id}
                      onClick={() => updateCompany(c.id, { licenseStatus: "inactive" })}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      disabled={savingId === c.id}
                      onClick={() => updateCompany(c.id, { licenseStatus: "active" })}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No companies have signed up yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default SuperAdmin;
