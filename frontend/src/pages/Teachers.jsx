import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const emptyForm = { name: "", email: "", phone: "", employeeId: "", department: "", subjects: "", qualification: "" };

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [issueLogin, setIssueLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await api.get("/teachers");
    setTeachers(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/teachers", {
        ...form,
        subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        issueLogin,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add teacher.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (id) => {
    await api.post(`/teachers/${id}/invite`);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this teacher?")) return;
    await api.delete(`/teachers/${id}`);
    load();
  };

  return (
    <Layout title="Teachers">
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Cancel" : "+ Add teacher"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-2">
          {error && <p className="md:col-span-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Employee ID</label>
            <input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Qualification</label>
            <input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Subjects (comma separated)</label>
            <input value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} placeholder="Math, Physics" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
            <input type="checkbox" checked={issueLogin} onChange={(e) => setIssueLogin(e.target.checked)} />
            Send login credentials by email
          </label>
          <button type="submit" disabled={submitting} className="md:col-span-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
            {submitting ? "Adding…" : "Add teacher"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map((t) => (
              <tr key={t._id}>
                <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                <td className="px-4 py-3 text-slate-500">{t.email}</td>
                <td className="px-4 py-3 text-slate-500">{t.department || "—"}</td>
                <td className="px-4 py-3">
                  {t.userAccount ? (
                    <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">Active</span>
                  ) : (
                    <button onClick={() => handleInvite(t._id)} className="text-xs font-medium text-teal-600 hover:underline">
                      Send login
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(t._id)} className="text-xs font-medium text-rose-500 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No teachers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Teachers;
