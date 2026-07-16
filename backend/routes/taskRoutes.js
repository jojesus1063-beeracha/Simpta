const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { sendEmail, taskAssignedEmail, taskStatusUpdatedEmail } = require("../utils/sendEmail");

const router = express.Router();

// @route  GET /api/tasks
// @desc   Admin sees every task; members see only tasks assigned to them
router.get("/", protect, async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .sort({ createdAt: -1 });
  res.json(tasks);
});

// @route  POST /api/tasks
// @desc   Admin creates a task and assigns it to a user; assignee gets an email
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    if (!title || !assignedTo) return res.status(400).json({ message: "Title and assignee are required" });

    const assignee = await User.findById(assignedTo);
    if (!assignee) return res.status(404).json({ message: "Assignee not found" });

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      dueDate,
    });

    const populated = await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "assignedBy", select: "name email" },
    ]);

    await sendEmail(taskAssignedEmail(populated, assignee));

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
});

// @route  PATCH /api/tasks/:id/status
// @desc   Member (or admin) updates a task's status; the admin who assigned it gets notified
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id).populate("assignedBy", "name email");
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
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    const task = await Task.findById(req.params.id);
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
router.delete("/:id", protect, adminOnly, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Task removed" });
});

// @route  GET /api/tasks/analytics/summary
// @desc   Admin-only aggregated stats for the dashboard (counts by status, priority, per user)
router.get("/analytics/summary", protect, adminOnly, async (req, res) => {
  const [byStatus, byPriority, byUser, total] = await Promise.all([
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Task.aggregate([
      { $group: { _id: "$assignedTo", count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { name: "$user.name", count: 1, completed: 1 } },
    ]),
    Task.countDocuments(),
  ]);

  const overdue = await Task.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $ne: "completed" },
  });

  res.json({ total, overdue, byStatus, byPriority, byUser });
});

module.exports = router;
