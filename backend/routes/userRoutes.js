const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { sendEmail } = require("../utils/sendEmail");

const router = express.Router();

router.get("/", protect, adminOnly, async (req, res) => {
  const users = await User.find({ company: req.user.company }).select("-password").sort({ createdAt: -1 });
  res.json(users);
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email are required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with that email already exists" });

    const tempPassword = crypto.randomBytes(6).toString("hex");
    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role: role === "admin" ? "admin" : "member",
      company: req.user.company,
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

router.delete("/:id", protect, adminOnly, async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }
  await User.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "User removed" });
});

module.exports = router;
