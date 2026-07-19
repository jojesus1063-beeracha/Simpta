const express = require("express");
const crypto = require("crypto");
const Teacher = require("../models/Teacher");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");
const { sendEmail } = require("../utils/sendEmail");

const router = express.Router();

const issueLoginFor = async (teacher, req) => {
  const existingUser = await User.findOne({ email: teacher.email });
  if (existingUser) {
    teacher.userAccount = existingUser._id;
    await teacher.save();
    return;
  }
  const tempPassword = crypto.randomBytes(6).toString("hex");
  const user = await User.create({
    name: teacher.name,
    email: teacher.email,
    password: tempPassword,
    role: "teacher",
    company: req.user.company,
  });
  teacher.userAccount = user._id;
  await teacher.save();

  await sendEmail({
    to: teacher.email,
    subject: "Your teacher account is ready",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#0f172a;">Welcome</h2>
        <p>A teacher account has been created for you.</p>
        <p><strong>Email:</strong> ${teacher.email}<br/>
           <strong>Temporary password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password as soon as possible.</p>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;">
          Log in
        </a>
      </div>
    `,
  });
};

// @route  GET /api/teachers
router.get("/", protect, checkLicense, adminOnly, async (req, res) => {
  const teachers = await Teacher.find({ company: req.user.company }).sort({ createdAt: -1 });
  res.json(teachers);
});

// @route  GET /api/teachers/me
// @desc   The logged-in teacher's own profile
router.get("/me", protect, checkLicense, async (req, res) => {
  const teacher = await Teacher.findOne({ userAccount: req.user._id, company: req.user.company });
  if (!teacher) return res.status(404).json({ message: "No teacher profile linked to this account" });
  res.json(teacher);
});

// @route  PATCH /api/teachers/me
// @desc   Teacher updates their own photo
router.patch("/me", protect, checkLicense, async (req, res) => {
  const teacher = await Teacher.findOne({ userAccount: req.user._id, company: req.user.company });
  if (!teacher) return res.status(404).json({ message: "No teacher profile linked to this account" });
  if (req.body.photoUrl !== undefined) teacher.photoUrl = req.body.photoUrl;
  await teacher.save();
  res.json(teacher);
});

// @route  POST /api/teachers
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, employeeId, department, subjects, qualification, joiningDate, photoUrl, issueLogin } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email are required" });

    const teacher = await Teacher.create({
      company: req.user.company,
      name,
      email,
      phone,
      employeeId,
      department,
      subjects: subjects || [],
      qualification,
      joiningDate,
      photoUrl,
    });

    if (issueLogin) await issueLoginFor(teacher, req);

    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ message: "Failed to create teacher", error: err.message });
  }
});

// @route  PUT /api/teachers/me
// @desc   The logged-in teacher updates their own photo
router.put("/me", protect, checkLicense, async (req, res) => {
  const teacher = await Teacher.findOne({ userAccount: req.user._id, company: req.user.company });
  if (!teacher) return res.status(404).json({ message: "No teacher profile linked to this account" });
  if (req.body.photoUrl !== undefined) teacher.photoUrl = req.body.photoUrl;
  await teacher.save();
  res.json(teacher);
});

// @route  PUT /api/teachers/:id
router.put("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, company: req.user.company });
  if (!teacher) return res.status(404).json({ message: "Teacher not found" });
  Object.assign(teacher, req.body);
  await teacher.save();
  res.json(teacher);
});

// @route  POST /api/teachers/:id/invite
router.post("/:id/invite", protect, checkLicense, adminOnly, async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, company: req.user.company });
  if (!teacher) return res.status(404).json({ message: "Teacher not found" });
  if (teacher.userAccount) return res.status(400).json({ message: "This teacher already has login access" });
  await issueLoginFor(teacher, req);
  res.json(teacher);
});

// @route  DELETE /api/teachers/:id
router.delete("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  await Teacher.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "Teacher removed" });
});

module.exports = router;
