import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const PERMISSIONS = [
  { key: "createTasks", label: "Create & assign tasks" },
  { key: "editAnyTask", label: "Edit any task" },
  { key: "manageTeam", label: "Manage team (add/remove people)" },
  { key: "manageFeed", label: "Post to the feed" },
  { key: "managePhotoBox", label: "Manage the photo board" },
];

const Permissions = () => {
  const [users, setUsers] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (userId, key, value) => {
    setSavingId(userId);
    await api.patch(`/users/${userId}/permissions`, { [key]: value });
    await load();
    setSavingId(null);
  };

  return (
    <Layout title="Permissions">
      <p className="mb-6 text-sm text-slate-500">
        Admins always have full access. Use these to grant specific extra abilities to individual teammates —
        useful for people who aren't full admins but need to help manage certain things.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Person</th>
              {PERMISSIONS.map((p) => (
                <th key={p.key} className="px-4 py-3">{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users
              .filter((u) => u.role !== "admin")
              .map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  {PERMISSIONS.map((p) => (
                    <td key={p.key} className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!u.permissions?.[p.key]}
                        disabled={savingId === u._id}
                        onChange={(e) => toggle(u._id, p.key, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            {users.filter((u) => u.role !== "admin").length === 0 && (
              <tr>
                <td colSpan={PERMISSIONS.length + 1} className="px-4 py-8 text-center text-slate-400">
                  No teammates yet besides admins.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Permissions;
