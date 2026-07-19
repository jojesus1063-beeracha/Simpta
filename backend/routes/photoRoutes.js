const express = require("express");
const PhotoBoxItem = require("../models/PhotoBoxItem");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");

const router = express.Router();

// @route  GET /api/photobox
router.get("/", protect, checkLicense, async (req, res) => {
  const photos = await PhotoBoxItem.find({ company: req.user.company }).sort({ createdAt: -1 });
  res.json(photos);
});

// @route  POST /api/photobox
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { url, caption } = req.body;
    if (!url) return res.status(400).json({ message: "A photo URL is required" });
    const photo = await PhotoBoxItem.create({ company: req.user.company, url, caption, addedBy: req.user._id });
    res.status(201).json(photo);
  } catch (err) {
    res.status(500).json({ message: "Failed to add photo", error: err.message });
  }
});

// @route  DELETE /api/photobox/:id
router.delete("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  await PhotoBoxItem.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "Photo removed" });
});

module.exports = router;
