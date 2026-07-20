const express = require("express");
const Company = require("../models/Company");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { requireSuperAdmin } = require("../middleware/superAdmin");

const router = express.Router();

const TIER_LIMITS = { "5": 5, "30": 30, "50": 50, unlimited: null, trial: null };

// @route  GET /api/superadmin/companies
// @desc   List every company workspace with its admin contact, license, and IDs
router.get("/companies", protect, requireSuperAdmin, async (req, res) => {
  const companies = await Company.find().sort({ createdAt: -1 });

  const withAdmins = await Promise.all(
    companies.map(async (company) => {
      const admin = await User.findOne({ company: company._id, role: "admin" }).select(
        "name email userId organisationId"
      );
      const userCount = await User.countDocuments({ company: company._id });
      return {
        id: company._id,
        name: company.name,
        workspaceId: company.workspaceId,
        productType: company.productType,
        licenseStatus: company.licenseStatus,
        licenseTier: company.licenseTier,
        maxUsers: company.maxUsers,
        userCount,
        plan: company.plan,
        trialEndsAt: company.trialEndsAt,
        createdAt: company.createdAt,
        admin,
      };
    })
  );

  res.json(withAdmins);
});

// @route  PATCH /api/superadmin/companies/:id
// @desc   Activate/deactivate a company, set its plan/tier, or product type
router.patch("/companies/:id", protect, requireSuperAdmin, async (req, res) => {
  try {
    const { licenseStatus, plan, productType, licenseTier } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    if (licenseStatus) company.licenseStatus = licenseStatus;
    if (plan !== undefined) company.plan = plan;
    if (productType) company.productType = productType;
    if (licenseTier) {
      company.licenseTier = licenseTier;
      company.maxUsers = TIER_LIMITS[licenseTier] ?? null;
    }
    await company.save();

    res.json(company);
  } catch (err) {
    res.status(500).json({ message: "Failed to update company", error: err.message });
  }
});

module.exports = router;
