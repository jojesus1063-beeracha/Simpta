const express = require("express");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const SchoolClass = require("../models/SchoolClass");
const Attendance = require("../models/Attendance");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");

const router = express.Router();

// @route  GET /api/school/dashboard
router.get("/dashboard", protect, checkLicense, adminOnly, async (req, res) => {
  const companyId = req.user.company;

  const [totalTeachers, totalStudents, totalClasses] = await Promise.all([
    Teacher.countDocuments({ company: companyId }),
    Student.countDocuments({ company: companyId }),
    SchoolClass.countDocuments({ company: companyId }),
  ]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todayRecords = await Attendance.find({
    company: companyId,
    date: { $gte: startOfToday, $lte: endOfToday },
  });

  const presentToday = todayRecords.filter((r) => r.status === "present").length;

  res.json({
    totalTeachers,
    totalStudents,
    totalClasses,
    attendanceMarkedToday: todayRecords.length,
    presentToday,
  });
});

module.exports = router;
