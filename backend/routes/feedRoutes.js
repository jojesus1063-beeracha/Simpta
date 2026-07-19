const express = require("express");
const Feed = require("../models/Feed");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");
const { notifyCompany } = require("../utils/notify");

const router = express.Router();

// @route  GET /api/feed
// @desc   Everyone in the company can read the feed
router.get("/", protect, checkLicense, async (req, res) => {
  const posts = await Feed.find({ company: req.user.company }).populate("createdBy", "name").sort({ createdAt: -1 });
  res.json(posts);
});

// @route  POST /api/feed
// @desc   Admin-only: post to the feed, notifies everyone else in the company
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const post = await Feed.create({ company: req.user.company, title, body, createdBy: req.user._id });

    await notifyCompany({
      companyId: req.user.company,
      excludeUserId: req.user._id,
      type: "feed",
      message: `New post: "${title}"`,
      link: "/feed",
    });

    const populated = await post.populate("createdBy", "name");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
});

// @route  DELETE /api/feed/:id
router.delete("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  await Feed.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "Post removed" });
});

module.exports = router;
