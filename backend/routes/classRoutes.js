const express = require("express");
const SchoolClass = require("../models/SchoolClass");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");

const router = express.Router();

// @route  GET /api/classes
// @desc   Admin sees all classes; teacher sees classes they teach; student sees their own class
router.get("/", protect, checkLicense, async (req, res) => {
  if (req.user.role === "admin") {
    const classes = await SchoolClass.find({ company: req.user.company })
      .populate("classTeacher", "name email")
      .sort({ name: 1 });
    return res.json(classes);
  }

  if (req.user.role === "teacher") {
    const teacher = await Teacher.findOne({ userAccount: req.user._id, company: req.user.company });
    if (!teacher) return res.json([]);
    const classes = await SchoolClass.find({ company: req.user.company, classTeacher: teacher._id }).populate(
      "classTeacher",
      "name email"
    );
    return res.json(classes);
  }

  if (req.user.role === "student") {
    const student = await Student.findOne({ userAccount: req.user._id, company: req.user.company });
    if (!student || !student.class) return res.json([]);
    const cls = await SchoolClass.findById(student.class).populate("classTeacher", "name email");
    return res.json(cls ? [cls] : []);
  }

  res.json([]);
});

// @route  POST /api/classes
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { name, section, classTeacher } = req.body;
    if (!name) return res.status(400).json({ message: "Class name is required" });
    const schoolClass = await SchoolClass.create({
      company: req.user.company,
      name,
      section,
      classTeacher: classTeacher || null,
    });
    res.status(201).json(schoolClass);
  } catch (err) {
    res.status(500).json({ message: "Failed to create class", error: err.message });
  }
});

// @route  PUT /api/classes/:id
router.put("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  const schoolClass = await SchoolClass.findOne({ _id: req.params.id, company: req.user.company });
  if (!schoolClass) return res.status(404).json({ message: "Class not found" });
  Object.assign(schoolClass, req.body);
  await schoolClass.save();
  res.json(schoolClass);
});

// @route  DELETE /api/classes/:id
router.delete("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  await SchoolClass.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "Class removed" });
});

module.exports = router;
