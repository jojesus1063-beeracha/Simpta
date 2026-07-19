const mongoose = require("mongoose");

const schoolClassSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true },
    section: { type: String, default: "" },
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SchoolClass", schoolClassSchema);
