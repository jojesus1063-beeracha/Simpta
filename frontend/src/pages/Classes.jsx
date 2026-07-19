import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: "", section: "", classTeacher: "" });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [classRes, teacherRes] = await Promise.all([api.get("/classes"), api.get("/teachers")]);
    setClasses(classRes.data);
    setTeachers(teacherRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/classes", { ...form, classTeacher: form.classTeacher || null });
      setForm({ name: "", section: "", classTeacher: "" });
      setShowForm(false);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this class?")) return;
    await api.delete(`/classes/${id}`);
    load();
  };

  return (
    <Layout title="Classes">
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Cancel" : "+ Add class"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Class name</label>
            <input required placeholder="Grade 5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Section</label>
            <input placeholder="A" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Class teacher</label>
            <select value={form.classTeacher} onChange={(e) => setForm({ ...form, classTeacher: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={submitting} className="md:col-span-3 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
            {submitting ? "Adding…" : "Add class"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Class teacher</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classes.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.section || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{c.classTeacher?.name || "Unassigned"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(c._id)} className="text-xs font-medium text-rose-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No classes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Classes;
