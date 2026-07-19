const express = require("express");
const Attendance = require("../models/Attendance");
const SchoolClass = require("../models/SchoolClass");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const { protect } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");

const router = express.Router();

// Confirms the current user (admin, or the teacher assigned to the class) may mark/view a class
const canAccessClass = async (req, classId) => {
  if (req.user.role === "admin") return true;
  if (req.user.role !== "teacher") return false;
  const teacher = await Teacher.findOne({ userAccount: req.user._id, company: req.user.company });
  if (!teacher) return false;
  const cls = await SchoolClass.findOne({ _id: classId, company: req.user.company, classTeacher: teacher._id });
  return !!cls;
};

// @route  POST /api/attendance
// @desc   Mark attendance for a class on a date. Body: { classId, date, records: [{studentId, status}] }
router.post("/", protect, checkLicense, async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({ message: "classId, date, and records are required" });
    }
    if (!(await canAccessClass(req, classId))) {
      return res.status(403).json({ message: "You don't have access to mark attendance for this class" });
    }

    const day = new Date(date);
    const results = await Promise.all(
      records.map(({ studentId, status }) =>
        Attendance.findOneAndUpdate(
          { company: req.user.company, class: classId, student: studentId, date: day },
          { status, markedBy: req.user._id },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to save attendance", error: err.message });
  }
});

// @route  GET /api/attendance?classId=&date=
router.get("/", protect, checkLicense, async (req, res) => {
  const { classId, date } = req.query;
  if (!classId || !date) return res.status(400).json({ message: "classId and date are required" });
  if (!(await canAccessClass(req, classId))) {
    return res.status(403).json({ message: "You don't have access to this class" });
  }

  const records = await Attendance.find({ company: req.user.company, class: classId, date: new Date(date) }).populate(
    "student",
    "name rollNumber"
  );
  res.json(records);
});

// @route  GET /api/attendance/student/:studentId
// @desc   Admin, the class teacher, or the student themself can view a student's attendance history
router.get("/student/:studentId", protect, checkLicense, async (req, res) => {
  const student = await Student.findOne({ _id: req.params.studentId, company: req.user.company });
  if (!student) return res.status(404).json({ message: "Student not found" });

  const isSelf = req.user.role === "student" && String(student.userAccount) === String(req.user._id);
  const isAdmin = req.user.role === "admin";
  const isClassTeacher = student.class && (await canAccessClass(req, student.class));

  if (!isSelf && !isAdmin && !isClassTeacher) {
    return res.status(403).json({ message: "You don't have access to this student's attendance" });
  }

  const records = await Attendance.find({ company: req.user.company, student: student._id }).sort({ date: -1 });
  res.json(records);
});

module.exports = router;
