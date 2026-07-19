import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import PhotoBox from "../components/PhotoBox";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: "", body: "" });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const res = await api.get("/feed");
    setPosts(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/feed", form);
      setForm({ title: "", body: "" });
      setShowForm(false);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this post?")) return;
    await api.delete(`/feed/${id}`);
    load();
  };

  return (
    <Layout title="Feed">
      <PhotoBox />

      {user?.role === "admin" && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {showForm ? "Cancel" : "+ New post"}
          </button>
          {showForm && (
            <form onSubmit={handleCreate} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-6">
              <input
                required
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                rows={3}
                placeholder="What's the update?"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {submitting ? "Posting…" : "Post to everyone"}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="space-y-4">
        {posts.map((p) => (
          <div key={p._id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-1 flex items-start justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">{p.title}</h3>
              {user?.role === "admin" && (
                <button onClick={() => handleDelete(p._id)} className="text-xs font-medium text-rose-500 hover:underline">
                  Delete
                </button>
              )}
            </div>
            {p.body && <p className="mb-2 whitespace-pre-wrap text-sm text-slate-600">{p.body}</p>}
            <p className="text-xs text-slate-400">
              {p.createdBy?.name} · {timeAgo(p.createdAt)}
            </p>
          </div>
        ))}
        {posts.length === 0 && <p className="text-slate-400">No posts yet.</p>}
      </div>
    </Layout>
  );
};

export default Feed;
