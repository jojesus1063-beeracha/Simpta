import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import PhotoUpload from "../components/PhotoUpload";

const emptyForm = { name: "", admissionNumber: "", rollNumber: "", class: "", parentName: "", parentPhone: "", parentEmail: "", photoUrl: "" };

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [issueLogin, setIssueLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [studentRes, classRes] = await Promise.all([api.get("/students"), api.get("/classes")]);
    setStudents(studentRes.data);
    setClasses(classRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/students", { ...form, class: form.class || null, issueLogin });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add student.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (id) => {
    await api.post(`/students/${id}/invite`);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this student?")) return;
    await api.delete(`/students/${id}`);
    load();
  };

  const handlePhoto = async (id, url) => {
    await api.put(`/students/${id}`, { photoUrl: url });
    load();
  };

  return (
    <Layout title="Students">
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Cancel" : "+ Add student"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-2">
          {error && <p className="md:col-span-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Photo</label>
            <PhotoUpload photoUrl={form.photoUrl} onUploaded={(url) => setForm({ ...form, photoUrl: url })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
            <select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Unassigned</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Admission number</label>
            <input value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Roll number</label>
            <input value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Parent name</label>
            <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Parent phone</label>
            <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Parent/contact email</label>
            <input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
            <input type="checkbox" checked={issueLogin} onChange={(e) => setIssueLogin(e.target.checked)} />
            Send login credentials to the parent/contact email above
          </label>
          <button type="submit" disabled={submitting} className="md:col-span-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
            {submitting ? "Adding…" : "Add student"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Roll no.</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s._id}>
                <td className="px-4 py-3">
                  <PhotoUpload photoUrl={s.photoUrl} onUploaded={(url) => handlePhoto(s._id, url)} size={36} />
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 text-slate-500">{s.class ? `${s.class.name}${s.class.section ? " - " + s.class.section : ""}` : "—"}</td>
                <td className="px-4 py-3 text-slate-500">{s.rollNumber || "—"}</td>
                <td className="px-4 py-3">
                  {s.userAccount ? (
                    <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">Active</span>
                  ) : (
                    <button onClick={() => handleInvite(s._id)} className="text-xs font-medium text-teal-600 hover:underline">
                      Send login
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(s._id)} className="text-xs font-medium text-rose-500 hover:underline">Remove</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Students;
