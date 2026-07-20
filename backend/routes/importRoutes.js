const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const SchoolClass = require("../models/SchoolClass");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");
const { issueTeacherLogin, issueStudentLogin } = require("../utils/issueLogin");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// @route  GET /api/import/template
// @desc   Downloads a blank .xlsx with the exact columns the importer expects
router.get("/template", protect, adminOnly, (req, res) => {
  const wb = XLSX.utils.book_new();

  const teacherSheet = XLSX.utils.aoa_to_sheet([
    ["Name", "Email", "Phone", "Employee ID", "Department", "Subjects (comma separated)", "Qualification"],
    ["Jane Doe", "jane@example.com", "555-1234", "T-001", "Science", "Physics, Chemistry", "M.Sc Physics"],
  ]);
  const classSheet = XLSX.utils.aoa_to_sheet([
    ["Class Name", "Section", "Class Teacher Email"],
    ["Grade 5", "A", "jane@example.com"],
  ]);
  const studentSheet = XLSX.utils.aoa_to_sheet([
    ["Name", "Admission Number", "Roll Number", "Class Name", "Section", "Parent Name", "Parent Phone", "Parent Email"],
    ["John Smith", "A-1001", "5", "Grade 5", "A", "Mary Smith", "555-5678", "mary@example.com"],
  ]);

  XLSX.utils.book_append_sheet(wb, teacherSheet, "Teachers");
  XLSX.utils.book_append_sheet(wb, classSheet, "Classes");
  XLSX.utils.book_append_sheet(wb, studentSheet, "Students");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", "attachment; filename=simpta-import-template.xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// @route  POST /api/import/school
// @desc   Admin uploads a filled-in .xlsx to bulk-create Teachers, Classes, and Students.
//         Sheets are processed in this order: Teachers -> Classes -> Students, so that
//         class teacher and student-class references can resolve correctly.
router.post("/school", protect, checkLicense, adminOnly, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const issueLogins = req.body.issueLogins === "true";
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });

    const getSheet = (name) => {
      const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === name.toLowerCase());
      return sheetName ? XLSX.utils.sheet_to_json(wb.Sheets[sheetName]) : [];
    };

    const teacherRows = getSheet("Teachers");
    const classRows = getSheet("Classes");
    const studentRows = getSheet("Students");

    const errors = [];
    let teachersCreated = 0;
    let classesCreated = 0;
    let studentsCreated = 0;
    let loginsSkippedSeatLimit = 0;
    const teacherEmailMap = {};

    for (const row of teacherRows) {
      const name = row["Name"];
      const email = row["Email"];
      if (!name || !email) {
        errors.push(`Teacher row skipped — missing name or email (row: ${JSON.stringify(row)})`);
        continue;
      }
      const lowerEmail = String(email).toLowerCase();
      try {
        const existing = await Teacher.findOne({ company: req.user.company, email: lowerEmail });
        if (existing) {
          teacherEmailMap[lowerEmail] = existing._id;
          errors.push(`Teacher ${email} already exists — skipped creation`);
          continue;
        }

        const teacher = await Teacher.create({
          company: req.user.company,
          name,
          email: lowerEmail,
          phone: row["Phone"] || "",
          employeeId: row["Employee ID"] || "",
          department: row["Department"] || "",
          subjects: row["Subjects (comma separated)"]
            ? String(row["Subjects (comma separated)"]).split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          qualification: row["Qualification"] || "",
        });
        teacherEmailMap[lowerEmail] = teacher._id;
        teachersCreated++;

        if (issueLogins) {
          const result = await issueTeacherLogin(teacher, req.user.company);
          if (!result.ok) loginsSkippedSeatLimit++;
        }
      } catch (err) {
        errors.push(`Teacher ${email}: ${err.message}`);
      }
    }

    const classKeyMap = {};
    for (const row of classRows) {
      const name = row["Class Name"];
      if (!name) {
        errors.push(`Class row skipped — missing class name (row: ${JSON.stringify(row)})`);
        continue;
      }
      try {
        const section = row["Section"] || "";
        const teacherEmail = row["Class Teacher Email"] ? String(row["Class Teacher Email"]).toLowerCase() : null;
        const classTeacher = teacherEmail ? teacherEmailMap[teacherEmail] || null : null;

        const schoolClass = await SchoolClass.create({ company: req.user.company, name, section, classTeacher });
        classKeyMap[`${name}|${section}`.toLowerCase()] = schoolClass._id;
        classesCreated++;
      } catch (err) {
        errors.push(`Class ${name}: ${err.message}`);
      }
    }

    for (const row of studentRows) {
      const name = row["Name"];
      if (!name) {
        errors.push(`Student row skipped — missing name (row: ${JSON.stringify(row)})`);
        continue;
      }
      try {
        const className = row["Class Name"] || "";
        const section = row["Section"] || "";
        const classId = classKeyMap[`${className}|${section}`.toLowerCase()] || null;
        const parentEmail = row["Parent Email"] ? String(row["Parent Email"]).toLowerCase() : "";

        const student = await Student.create({
          company: req.user.company,
          name,
          admissionNumber: row["Admission Number"] || "",
          rollNumber: row["Roll Number"] || "",
          class: classId,
          parentName: row["Parent Name"] || "",
          parentPhone: row["Parent Phone"] || "",
          parentEmail,
        });
        studentsCreated++;

        if (issueLogins && parentEmail) {
          const result = await issueStudentLogin(student, req.user.company, parentEmail);
          if (!result.ok) loginsSkippedSeatLimit++;
        }
      } catch (err) {
        errors.push(`Student ${name}: ${err.message}`);
      }
    }

    res.json({ teachersCreated, classesCreated, studentsCreated, loginsSkippedSeatLimit, errors });
  } catch (err) {
    res.status(500).json({ message: "Import failed", error: err.message });
  }
});

module.exports = router;
