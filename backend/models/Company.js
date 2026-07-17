const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseStatus: { type: String, enum: ["trial", "active", "inactive"], default: "trial" },
    plan: { type: String, default: "Trial" },
    trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
