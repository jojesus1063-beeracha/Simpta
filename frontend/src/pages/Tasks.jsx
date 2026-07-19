import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { StatusBadge, PriorityBadge } from "../components/Badges";
import { useAuth } from "../context/AuthContext";

const emptyForm = { title: "", description: "", assignedTo: "", owner: "", priority: "medium", dueDate: "" };

const Tasks = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canCreate = isAdmin || user?.role === "teacher" || user?.permissions?.createTasks;
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadTasks = async () => {
    const res = await api.get("/tasks");
    setTasks(res.data);
  };

  useEffect(() => {
    loadTasks();
    if (canCreate) api.get("/users").then((res) => setUsers(res.data)).catch(() => {});
  }, [canCreate]);

  const canEdit = (t) =>
    isAdmin || user?.permissions?.editAnyTask || (t.owner && t.owner._id === user?.id);

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, form);
      } else {
        await api.post("/tasks", form);
      }
      resetForm();
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save task.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (t) => {
    setForm({
      title: t.title,
      description: t.description || "",
      assignedTo: t.assignedTo?._id || "",
      owner: t.owner?._id || "",
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
    });
    setEditingId(t._id);
    setShowForm(true);
  };

  const handleStatusChange = async (id, status) => {
    await api.patch(`/tasks/${id}/status`, { status });
    loadTasks();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${id}`);
    loadTasks();
  };

  const filteredTasks = tasks.filter((t) => filter === "all" || t.status === filter);

  return (
    <Layout title={canCreate ? "All tasks" : "My tasks"}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "pending", "in-progress", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === f ? "bg-ink text-white" : "bg-white text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {canCreate && (
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {showForm ? "Cancel" : "+ New task"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-2">
          {error && <p className="md:col-span-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Assign to</label>
            <select
              required
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Select a person</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Due date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Task owner</label>
            <select
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Me (default)</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              The owner (along with admins) can edit this task later — separate from who it's assigned to.
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? "Saving…" : editingId ? "Save changes" : "Create & assign task"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Task</th>
              {canCreate && <th className="px-4 py-3">Assigned to</th>}
              {canCreate && <th className="px-4 py-3">Owner</th>}
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map((t) => (
              <tr key={t._id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{t.title}</p>
                  {t.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{t.description}</p>}
                </td>
                {canCreate && <td className="px-4 py-3 text-slate-500">{t.assignedTo?.name}</td>}
                {canCreate && <td className="px-4 py-3 text-slate-500">{t.owner?.name || "—"}</td>}
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t._id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    {canEdit(t) && (
                      <button onClick={() => startEdit(t)} className="text-xs font-medium text-teal-600 hover:underline">
                        Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(t._id)} className="text-xs font-medium text-rose-500 hover:underline">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={canCreate ? 7 : 4} className="px-4 py-8 text-center text-slate-400">
                  No tasks here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Tasks;
