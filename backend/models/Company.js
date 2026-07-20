const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    workspaceId: { type: String, unique: true, sparse: true },
    productType: { type: String, enum: ["tasks", "school"], default: "tasks" },
    licenseStatus: { type: String, enum: ["trial", "active", "inactive"], default: "trial" },
    plan: { type: String, default: "Trial" },
    // "5", "30", "50", or "unlimited" once activated by the console admin.
    // "trial" and "unlimited" have no seat cap (maxUsers stays null).
    licenseTier: { type: String, enum: ["trial", "5", "30", "50", "unlimited"], default: "trial" },
    maxUsers: { type: Number, default: null },
    trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
