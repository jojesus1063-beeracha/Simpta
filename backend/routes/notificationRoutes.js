const express = require("express");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");

const router = express.Router();

// @route  GET /api/notifications
router.get("/", protect, checkLicense, async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  res.json(notifications);
});

// @route  GET /api/notifications/unread-count
router.get("/unread-count", protect, checkLicense, async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ count });
});

// @route  PATCH /api/notifications/:id/read
router.patch("/:id/read", protect, checkLicense, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ message: "Marked as read" });
});

// @route  PATCH /api/notifications/read-all
router.patch("/read-all", protect, checkLicense, async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: "All marked as read" });
});

module.exports = router;
