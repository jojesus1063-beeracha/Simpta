const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");
const { canCreateTasks } = require("../utils/permissions");
const { checkSeatAvailable } = require("../utils/seatLimit");
const { generateId } = require("../utils/generateId");
const { sendEmail } = require("../utils/sendEmail");

const router = express.Router();

// @route  GET /api/users
// @desc   List users in the company. Admins get this for team management;
//         anyone who can create tasks gets it to populate assign/owner dropdowns.
router.get("/", protect, checkLicense, async (req, res) => {
  if (req.user.role !== "admin" && !canCreateTasks(req.user)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  const users = await User.find({ company: req.user.company }).select("-password").sort({ createdAt: -1 });
  res.json(users);
});

// @route  GET /api/users/directory
// @desc   Lightweight name list for @mentions and chat - available to anyone in the company
router.get("/directory", protect, checkLicense, async (req, res) => {
  const users = await User.find({ company: req.user.company }).select("name _id");
  res.json(users);
});

// @route  POST /api/users
// @desc   Admin creates a new user account in their own company and emails them a temporary password
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email are required" });

    const seat = await checkSeatAvailable(req.user.company);
    if (!seat.ok) return res.status(403).json({ message: seat.message });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with that email already exists" });

    const tempPassword = crypto.randomBytes(6).toString("hex");
    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role: role === "admin" ? "admin" : "member",
      company: req.user.company,
      userId: generateId("USR"),
    });

    await sendEmail({
      to: user.email,
      subject: "You've been added to Task Manager",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color:#0f172a;">Welcome to Task Manager</h2>
          <p>An account has been created for you.</p>
          <p><strong>Email:</strong> ${user.email}<br/>
             <strong>Temporary password:</strong> ${tempPassword}</p>
          <p>Please log in and change your password as soon as possible.</p>
          <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;">
            Log in
          </a>
        </div>
      `,
    });

    res.status(201).json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
});

// @route  PATCH /api/users/:id/permissions
// @desc   Admin toggles granular access permissions for a teammate
router.patch("/:id/permissions", protect, checkLicense, adminOnly, async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, company: req.user.company });
  if (!user) return res.status(404).json({ message: "User not found" });

  const allowedKeys = ["createTasks", "editAnyTask", "manageTeam", "manageFeed", "managePhotoBox"];
  allowedKeys.forEach((key) => {
    if (req.body[key] !== undefined) user.permissions[key] = !!req.body[key];
  });
  await user.save();
  res.json(user.toSafeObject());
});

// @route  DELETE /api/users/:id
router.delete("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }
  await User.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "User removed" });
});

module.exports = router;
