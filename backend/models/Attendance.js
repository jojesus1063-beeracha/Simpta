const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent", "late"], default: "present" },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// One attendance record per student per class per day
attendanceSchema.index({ class: 1, student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
