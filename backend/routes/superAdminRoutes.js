const express = require("express");
const Company = require("../models/Company");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { requireSuperAdmin } = require("../middleware/superAdmin");

const router = express.Router();

router.get("/companies", protect, requireSuperAdmin, async (req, res) => {
  const companies = await Company.find().sort({ createdAt: -1 });

  const withAdmins = await Promise.all(
    companies.map(async (company) => {
      const admin = await User.findOne({ company: company._id, role: "admin" }).select("name email");
      return {
        id: company._id,
        name: company.name,
        licenseStatus: company.licenseStatus,
        plan: company.plan,
        trialEndsAt: company.trialEndsAt,
        createdAt: company.createdAt,
        admin,
      };
    })
  );

  res.json(withAdmins);
});

router.patch("/companies/:id", protect, requireSuperAdmin, async (req, res) => {
  try {
    const { licenseStatus, plan } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    if (licenseStatus) company.licenseStatus = licenseStatus;
    if (plan !== undefined) company.plan = plan;
    await company.save();

    res.json(company);
  } catch (err) {
    res.status(500).json({ message: "Failed to update company", error: err.message });
  }
});

module.exports = router;
