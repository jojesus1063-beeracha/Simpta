import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const todayStr = () => new Date().toISOString().slice(0, 10);

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/classes").then((res) => {
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setSaved(false);
    Promise.all([api.get("/students"), api.get(`/attendance?classId=${selectedClass}&date=${date}`)]).then(
      ([studentRes, attendanceRes]) => {
        const classStudents = studentRes.data.filter((s) => s.class?._id === selectedClass || s.class === selectedClass);
        setStudents(classStudents);
        const existing = {};
        attendanceRes.data.forEach((r) => {
          existing[r.student._id || r.student] = r.status;
        });
        const defaults = {};
        classStudents.forEach((s) => {
          defaults[s._id] = existing[s._id] || "present";
        });
        setStatuses(defaults);
      }
    );
  }, [selectedClass, date]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await api.post("/attendance", {
      classId: selectedClass,
      date,
      records: Object.entries(statuses).map(([studentId, status]) => ({ studentId, status })),
    });
    setSaving(false);
    setSaved(true);
  };

  return (
    <Layout title="Attendance">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        {classes.length === 0 && <p className="text-sm text-slate-400">No classes assigned to you yet.</p>}
      </div>

      {students.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll no.</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s._id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.rollNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={statuses[s._id] || "present"}
                      onChange={(e) => setStatuses({ ...statuses, [s._id]: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save attendance"}
            </button>
            {saved && <span className="text-sm text-teal-600">Saved.</span>}
          </div>
        </div>
      )}

      {selectedClass && students.length === 0 && (
        <p className="text-slate-400">No students assigned to this class yet.</p>
      )}
    </Layout>
  );
};

export default Attendance;
