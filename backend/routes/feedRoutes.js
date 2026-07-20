const express = require("express");
const Feed = require("../models/Feed");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");
const { notifyCompany, notifyUser } = require("../utils/notify");

const router = express.Router();

// @route  GET /api/feed
// @desc   Everyone in the company can read the feed
router.get("/", protect, checkLicense, async (req, res) => {
  const posts = await Feed.find({ company: req.user.company }).populate("createdBy", "name").sort({ createdAt: -1 });
  res.json(posts);
});

// @route  POST /api/feed
// @desc   Admin-only: post to the feed. Anyone @mentioned by name in the body
//         gets a direct notification; everyone else gets the general one.
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const post = await Feed.create({ company: req.user.company, title, body, createdBy: req.user._id });

    const companyUsers = await User.find({ company: req.user.company, _id: { $ne: req.user._id } }).select("name _id");
    const mentioned = (body ? companyUsers.filter((u) => body.includes(`@${u.name}`)) : []);
    const mentionedIds = mentioned.map((u) => String(u._id));

    await Promise.all(
      mentioned.map((u) =>
        notifyUser({
          companyId: req.user.company,
          userId: u._id,
          type: "feed",
          message: `${req.user.name} mentioned you in "${title}"`,
          link: "/feed",
        })
      )
    );

    // Everyone else (not already notified via a direct mention) gets the general post notice
    if (companyUsers.length > mentioned.length) {
      await notifyCompany({
        companyId: req.user.company,
        excludeUserId: req.user._id,
        excludeUserIds: mentionedIds,
        type: "feed",
        message: `New post: "${title}"`,
        link: "/feed",
      });
    }

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
