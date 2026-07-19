const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Company = require("../models/Company");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Starts a fresh session for this user on the given platform, invalidating
// any previous session on that same platform (web logins don't affect app
// sessions and vice versa).
const startSession = async (user, platform) => {
  const sessionId = crypto.randomBytes(16).toString("hex");
  if (platform === "app") {
    user.appSessionId = sessionId;
  } else {
    user.webSessionId = sessionId;
  }
  await user.save();
  return sessionId;
};

const signToken = (user, sessionId, platform) =>
  jwt.sign(
    { id: user._id, role: user.role, company: user.company, sessionId, platform },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const getCompanyStatus = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) return null;
  return {
    name: company.name,
    productType: company.productType,
    licenseStatus: company.licenseStatus,
    plan: company.plan,
    trialEndsAt: company.trialEndsAt,
  };
};

// @route  POST /api/auth/register
// @desc   Creates a brand new company workspace (on a free trial) and its
//         first admin user. Teammates after that are added by the admin via
//         /api/users (see userRoutes.js), joining that same company.
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, companyName, productType, platform } = req.body;
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: "Name, email, password and company name are all required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with that email already exists" });

    const company = await Company.create({ name: companyName, productType: productType === "school" ? "school" : "tasks" });
    const user = await User.create({ name, email, password, role: "admin", company: company._id });

    const platformKey = platform === "app" ? "app" : "web";
    const sessionId = await startSession(user, platformKey);

    res.status(201).json({
      user: user.toSafeObject(),
      token: signToken(user, sessionId, platformKey),
      companyStatus: await getCompanyStatus(company._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// @route  POST /api/auth/login
// @desc   Logging in on a platform (web/app) invalidates any other session
//         on that same platform for this account. Web and app sessions are
//         independent of each other.
router.post("/login", async (req, res) => {
  try {
    const { email, password, platform } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const platformKey = platform === "app" ? "app" : "web";
    const sessionId = await startSession(user, platformKey);

    res.json({
      user: user.toSafeObject(),
      token: signToken(user, sessionId, platformKey),
      companyStatus: user.isSuperAdmin ? null : await getCompanyStatus(user.company),
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// @route  GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({
    user: req.user.toSafeObject ? req.user.toSafeObject() : req.user,
    companyStatus: req.user.isSuperAdmin ? null : await getCompanyStatus(req.user.company),
  });
});

module.exports = router;
