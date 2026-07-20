import React, { useEffect, useRef, useState } from "react";
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

// Renders body text, highlighting @Name mentions that match a known teammate
const renderBody = (body, directory) => {
  if (!body) return null;
  const names = directory.map((d) => d.name).sort((a, b) => b.length - a.length);
  if (names.length === 0) return body;

  const pattern = new RegExp(`(@(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}))`, "g");
  const parts = body.split(pattern);
  return parts.map((part, i) =>
    part.startsWith("@") && names.includes(part.slice(1)) ? (
      <span key={i} className="font-medium text-teal-600">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [form, setForm] = useState({ title: "", body: "" });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStart, setMentionStart] = useState(null);
  const textareaRef = useRef(null);

  const load = async () => {
    const res = await api.get("/feed");
    setPosts(res.data);
  };

  useEffect(() => {
    load();
    api.get("/users/directory").then((res) => setDirectory(res.data));
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

  const handleBodyChange = (e) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setForm({ ...form, body: value });

    const beforeCursor = value.slice(0, cursor);
    const atIndex = beforeCursor.lastIndexOf("@");
    if (atIndex === -1) {
      setMentionQuery(null);
      return;
    }
    const between = beforeCursor.slice(atIndex + 1);
    if (/\s/.test(between)) {
      setMentionQuery(null);
      return;
    }
    setMentionStart(atIndex);
    setMentionQuery(between);
  };

  const selectMention = (name) => {
    const before = form.body.slice(0, mentionStart);
    const after = form.body.slice(mentionStart + 1 + mentionQuery.length);
    const newBody = `${before}@${name} ${after}`;
    setForm({ ...form, body: newBody });
    setMentionQuery(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const suggestions =
    mentionQuery !== null
      ? directory.filter((d) => d.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
      : [];

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
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows={3}
                  placeholder="What's the update? Type @ to mention someone"
                  value={form.body}
                  onChange={handleBodyChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                    {suggestions.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => selectMention(s.name)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
            {p.body && <p className="mb-2 whitespace-pre-wrap text-sm text-slate-600">{renderBody(p.body, directory)}</p>}
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
