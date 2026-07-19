const express = require("express");
const crypto = require("crypto");
const Student = require("../models/Student");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");
const { sendEmail } = require("../utils/sendEmail");

const router = express.Router();

const issueLoginFor = async (student, req, loginEmail) => {
  const existingUser = await User.findOne({ email: loginEmail });
  if (existingUser) {
    student.userAccount = existingUser._id;
    await student.save();
    return;
  }
  const tempPassword = crypto.randomBytes(6).toString("hex");
  const user = await User.create({
    name: student.name,
    email: loginEmail,
    password: tempPassword,
    role: "student",
    company: req.user.company,
  });
  student.userAccount = user._id;
  await student.save();

  await sendEmail({
    to: loginEmail,
    subject: "Your student account is ready",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#0f172a;">Welcome</h2>
        <p>A student account has been created for ${student.name}.</p>
        <p><strong>Email:</strong> ${loginEmail}<br/>
           <strong>Temporary password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password as soon as possible.</p>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;">
          Log in
        </a>
      </div>
    `,
  });
};

// @route  GET /api/students
// @desc   Admin sees every student; teachers see students in classes they teach
router.get("/", protect, checkLicense, async (req, res) => {
  if (req.user.role === "admin") {
    const students = await Student.find({ company: req.user.company }).populate("class", "name section").sort({ createdAt: -1 });
    return res.json(students);
  }

  if (req.user.role === "teacher") {
    const SchoolClass = require("../models/SchoolClass");
    const Teacher = require("../models/Teacher");
    const teacher = await Teacher.findOne({ userAccount: req.user._id, company: req.user.company });
    if (!teacher) return res.json([]);
    const myClasses = await SchoolClass.find({ company: req.user.company, classTeacher: teacher._id }).select("_id");
    const classIds = myClasses.map((c) => c._id);
    const students = await Student.find({ company: req.user.company, class: { $in: classIds } })
      .populate("class", "name section")
      .sort({ createdAt: -1 });
    return res.json(students);
  }

  res.status(403).json({ message: "Not authorized" });
});

// @route  GET /api/students/me
router.get("/me", protect, checkLicense, async (req, res) => {
  const student = await Student.findOne({ userAccount: req.user._id, company: req.user.company }).populate(
    "class",
    "name section"
  );
  if (!student) return res.status(404).json({ message: "No student profile linked to this account" });
  res.json(student);
});

// @route  POST /api/students
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { name, admissionNumber, rollNumber, dob, gender, class: classId, parentName, parentPhone, parentEmail, issueLogin } =
      req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (issueLogin && !parentEmail) {
      return res.status(400).json({ message: "A parent/contact email is required to issue login access" });
    }

    const student = await Student.create({
      company: req.user.company,
      name,
      admissionNumber,
      rollNumber,
      dob,
      gender,
      class: classId || null,
      parentName,
      parentPhone,
      parentEmail,
    });

    if (issueLogin) await issueLoginFor(student, req, parentEmail);

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: "Failed to create student", error: err.message });
  }
});

// @route  PUT /api/students/:id
router.put("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, company: req.user.company });
  if (!student) return res.status(404).json({ message: "Student not found" });
  Object.assign(student, req.body);
  await student.save();
  res.json(student);
});

// @route  POST /api/students/:id/invite
router.post("/:id/invite", protect, checkLicense, adminOnly, async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, company: req.user.company });
  if (!student) return res.status(404).json({ message: "Student not found" });
  if (student.userAccount) return res.status(400).json({ message: "This student already has login access" });
  if (!student.parentEmail) return res.status(400).json({ message: "Add a parent/contact email first" });
  await issueLoginFor(student, req, student.parentEmail);
  res.json(student);
});

// @route  DELETE /api/students/:id
router.delete("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  await Student.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "Student removed" });
});

module.exports = router;
