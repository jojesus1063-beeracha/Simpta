const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true },
    admissionNumber: { type: String, default: "" },
    rollNumber: { type: String, default: "" },
    dob: { type: Date },
    gender: { type: String, default: "" },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolClass", default: null },
    parentName: { type: String, default: "" },
    parentPhone: { type: String, default: "" },
    parentEmail: { type: String, default: "", lowercase: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    userAccount: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
