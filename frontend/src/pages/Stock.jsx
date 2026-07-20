import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const emptyForm = { category: "Books", name: "", quantity: "", notes: "" };

const Stock = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await api.get("/stock");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/stock", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add item.");
    } finally {
      setSubmitting(false);
    }
  };

  const adjustQuantity = async (item, delta) => {
    const next = Math.max(0, item.quantity + delta);
    await api.put(`/stock/${item._id}`, { quantity: next });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this item?")) return;
    await api.delete(`/stock/${id}`);
    load();
  };

  const grouped = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <Layout title="Stock">
      {isAdmin && (
        <div className="mb-5 flex justify-end">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {showForm ? "Cancel" : "+ Add item"}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-2">
          {error && <p className="md:col-span-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <input
              required
              list="stock-categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <datalist id="stock-categories">
              <option value="Books" />
              <option value="Sports Equipment" />
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Item name</label>
            <input
              required
              placeholder="e.g. Football, Atlas Grade 5"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
            <input
              required
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes (optional)</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add item"}
          </button>
        </form>
      )}

      {Object.keys(grouped).length === 0 && <p className="text-slate-400">No stock items yet.</p>}

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category} className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h2 className="font-display text-sm font-bold text-slate-800">{category}</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Quantity remaining</th>
                <th className="px-4 py-2">Notes</th>
                {isAdmin && <th className="px-4 py-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryItems.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustQuantity(item, -1)}
                          className="h-6 w-6 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => adjustQuantity(item, 1)}
                          className="h-6 w-6 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-800">{item.quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.notes || "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(item._id)} className="text-xs font-medium text-rose-500 hover:underline">
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Layout>
  );
};

export default Stock;
