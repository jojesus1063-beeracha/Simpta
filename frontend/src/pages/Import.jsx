import React, { useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const Import = () => {
  const [file, setFile] = useState(null);
  const [issueLogins, setIssueLogins] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleDownloadTemplate = async () => {
    const res = await api.get("/import/template", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "simpta-import-template.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    setImporting(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("issueLogins", issueLogins);
      const res = await api.post("/import/school", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Import failed. Check your file and try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Layout title="Import">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 font-display text-base font-bold text-slate-900">1. Download the template</h2>
          <p className="mb-4 text-sm text-slate-500">
            It's an Excel file with three tabs — <strong>Teachers</strong>, <strong>Classes</strong>, and{" "}
            <strong>Students</strong> — each with the exact column headers expected, plus one example row.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Download template (.xlsx)
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 font-display text-base font-bold text-slate-900">2. Upload your filled-in file</h2>
          <p className="mb-4 text-sm text-slate-500">
            Fill in the template (delete the example rows first) and upload it here. Classes are matched to
            students by Class Name + Section, and class teachers are matched by email.
          </p>

          {error && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <form onSubmit={handleImport} className="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={issueLogins} onChange={(e) => setIssueLogins(e.target.checked)} />
              Also create login access (not just a welcome email) for teachers and students with a parent/contact email
            </label>
            <p className="text-xs text-slate-400">
              Everyone imported with an email address gets a welcome email either way, with a link to log in.
            </p>
            <button
              type="submit"
              disabled={!file || importing}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {importing ? "Importing…" : "Import"}
            </button>
          </form>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900">Import results</h2>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-teal-50 p-4 text-center">
              <p className="text-2xl font-bold text-teal-700">{result.teachersCreated}</p>
              <p className="text-xs text-teal-600">Teachers added</p>
            </div>
            <div className="rounded-lg bg-teal-50 p-4 text-center">
              <p className="text-2xl font-bold text-teal-700">{result.classesCreated}</p>
              <p className="text-xs text-teal-600">Classes added</p>
            </div>
            <div className="rounded-lg bg-teal-50 p-4 text-center">
              <p className="text-2xl font-bold text-teal-700">{result.studentsCreated}</p>
              <p className="text-xs text-teal-600">Students added</p>
            </div>
          </div>
          {result.loginsSkippedSeatLimit > 0 && (
            <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {result.loginsSkippedSeatLimit} login(s) couldn't be issued — your plan's seat limit was reached.
            </p>
          )}
          {result.errors?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Notes ({result.errors.length})</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Import;
