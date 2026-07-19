const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    department: { type: String, default: "" },
    subjects: { type: [String], default: [] },
    qualification: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    joiningDate: { type: Date },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    photoUrl: { type: String, default: "" },
    userAccount: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);
