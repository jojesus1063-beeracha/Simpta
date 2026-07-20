const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const { protect } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");

const router = express.Router();

// @route  GET /api/chat?since=<messageId>
// @desc   Everyone in the company shares one workspace-wide chat channel.
//         Pass ?since=<lastMessageId> to poll for only newer messages.
router.get("/", protect, checkLicense, async (req, res) => {
  const { since } = req.query;
  const filter = { company: req.user.company };
  if (since) filter._id = { $gt: since };

  const messages = await ChatMessage.find(filter)
    .populate("sender", "name")
    .sort({ createdAt: since ? 1 : -1 })
    .limit(since ? 100 : 50);

  res.json(since ? messages : messages.reverse());
});

// @route  POST /api/chat
router.post("/", protect, checkLicense, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Message can't be empty" });

    const message = await ChatMessage.create({ company: req.user.company, sender: req.user._id, text: text.trim() });
    const populated = await message.populate("sender", "name");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message", error: err.message });
  }
});

module.exports = router;
