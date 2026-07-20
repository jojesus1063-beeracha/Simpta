require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");
const Task = require("./models/Task");
const Company = require("./models/Company");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const feedRoutes = require("./routes/feedRoutes");
const photoRoutes = require("./routes/photoRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/photobox", photoRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

// One-time migration: any users/tasks created before multi-tenancy was added
// won't have a company set. Give them all a single shared "legacy" company
// so nothing breaks. Safe to run every boot - it only acts if needed.
const migrateLegacyData = async () => {
  const orphanedUsers = await User.find({ company: { $exists: false } });
  if (orphanedUsers.length === 0) return;

  console.log(`Migrating ${orphanedUsers.length} pre-existing user(s) into a legacy company...`);
  const legacyCompany = await Company.create({ name: "Legacy Workspace", licenseStatus: "active" });
  await User.updateMany({ company: { $exists: false } }, { company: legacyCompany._id });
  await Task.updateMany({ company: { $exists: false } }, { company: legacyCompany._id });
  console.log("Migration complete.");
};

// Grants super-admin (platform owner) access to whichever account matches
// SUPER_ADMIN_EMAIL. Safe to run every boot - only acts if not already set.
const grantSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  if (!email) return;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.log(`SUPER_ADMIN_EMAIL is set to ${email}, but no matching account exists yet.`);
    return;
  }
  if (!user.isSuperAdmin) {
    user.isSuperAdmin = true;
    await user.save();
    console.log(`Granted super admin access to ${email}.`);
  }
};

connectDB().then(async () => {
  await migrateLegacyData();
  await grantSuperAdmin();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
