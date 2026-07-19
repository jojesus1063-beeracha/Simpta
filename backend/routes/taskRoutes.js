const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");
const { sendEmail, taskAssignedEmail, taskStatusUpdatedEmail } = require("../utils/sendEmail");
const { notifyUser } = require("../utils/notify");

const router = express.Router();

// @route  GET /api/tasks
// @desc   Admin sees every task in their company; members see only their own
router.get("/", protect, checkLicense, async (req, res) => {
  const filter =
    req.user.role === "admin"
      ? { company: req.user.company }
      : { company: req.user.company, assignedTo: req.user._id };
  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .sort({ createdAt: -1 });
  res.json(tasks);
});

// @route  POST /api/tasks
// @desc   Admin creates a task and assigns it to someone in their own company
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    if (!title || !assignedTo) return res.status(400).json({ message: "Title and assignee are required" });

    const assignee = await User.findOne({ _id: assignedTo, company: req.user.company });
    if (!assignee) return res.status(404).json({ message: "Assignee not found" });

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      dueDate,
      company: req.user.company,
    });

    const populated = await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "assignedBy", select: "name email" },
    ]);

    await sendEmail(taskAssignedEmail(populated, assignee));
    await notifyUser({
      companyId: req.user.company,
      userId: assignee._id,
      type: "task",
      message: `New task assigned: "${title}"`,
      link: "/tasks",
    });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
});

// @route  PATCH /api/tasks/:id/status
// @desc   Member (or admin) updates a task's status; the admin who assigned it gets notified
router.patch("/:id/status", protect, checkLicense, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findOne({ _id: req.params.id, company: req.user.company }).populate(
      "assignedBy",
      "name email"
    );
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isOwner = String(task.assignedTo) === String(req.user._id);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "You can only update your own tasks" });
    }

    task.status = status;
    await task.save();

    if (task.assignedBy && String(task.assignedBy._id) !== String(req.user._id)) {
      await sendEmail(taskStatusUpdatedEmail(task, task.assignedBy));
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Failed to update task", error: err.message });
  }
});

// @route  PUT /api/tasks/:id
// @desc   Admin edits task details (reassign, change priority/due date/etc.)
router.put("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    const task = await Task.findOne({ _id: req.params.id, company: req.user.company });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const reassigned = assignedTo && String(assignedTo) !== String(task.assignedTo);

    Object.assign(task, {
      title: title ?? task.title,
      description: description ?? task.description,
      assignedTo: assignedTo ?? task.assignedTo,
      priority: priority ?? task.priority,
      dueDate: dueDate ?? task.dueDate,
      status: status ?? task.status,
    });
    await task.save();

    const populated = await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "assignedBy", select: "name email" },
    ]);

    if (reassigned) {
      await sendEmail(taskAssignedEmail(populated, populated.assignedTo));
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update task", error: err.message });
  }
});

// @route  DELETE /api/tasks/:id
router.delete("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "Task removed" });
});

// @route  GET /api/tasks/analytics/summary
// @desc   Admin-only aggregated stats for the dashboard, scoped to their own company
router.get("/analytics/summary", protect, checkLicense, adminOnly, async (req, res) => {
  const companyId = req.user.company;

  const [byStatus, byPriority, byUser, total] = await Promise.all([
    Task.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Task.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: "$assignedTo", count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { name: "$user.name", count: 1, completed: 1 } },
    ]),
    Task.countDocuments({ company: companyId }),
  ]);

  const overdue = await Task.countDocuments({
    company: companyId,
    dueDate: { $lt: new Date() },
    status: { $ne: "completed" },
  });

  res.json({ total, overdue, byStatus, byPriority, byUser });
});

module.exports = router;
