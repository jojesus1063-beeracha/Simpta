const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const { protect } = require("../middleware/auth");

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, company: user.company }, process.env.JWT_SECRET, { expiresIn: "7d" });

const getCompanyStatus = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) return null;
  return {
    name: company.name,
    licenseStatus: company.licenseStatus,
    plan: company.plan,
    trialEndsAt: company.trialEndsAt,
  };
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: "Name, email, password and company name are all required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with that email already exists" });

    const company = await Company.create({ name: companyName });
    const user = await User.create({ name, email, password, role: "admin", company: company._id });

    res.status(201).json({
      user: user.toSafeObject(),
      token: signToken(user),
      companyStatus: await getCompanyStatus(company._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      user: user.toSafeObject(),
      token: signToken(user),
      companyStatus: user.isSuperAdmin ? null : await getCompanyStatus(user.company),
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({
    user: req.user.toSafeObject ? req.user.toSafeObject() : req.user,
    companyStatus: req.user.isSuperAdmin ? null : await getCompanyStatus(req.user.company),
  });
});

module.exports = router;
