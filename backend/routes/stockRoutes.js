const express = require("express");
const StockItem = require("../models/StockItem");
const { protect, adminOnly } = require("../middleware/auth");
const { checkLicense } = require("../middleware/license");

const router = express.Router();

// @route  GET /api/stock
// @desc   Everyone in the company can view the stock list
router.get("/", protect, checkLicense, async (req, res) => {
  const items = await StockItem.find({ company: req.user.company }).sort({ category: 1, name: 1 });
  res.json(items);
});

// @route  POST /api/stock
router.post("/", protect, checkLicense, adminOnly, async (req, res) => {
  try {
    const { category, name, quantity, notes } = req.body;
    if (!category || !name) return res.status(400).json({ message: "Category and name are required" });

    const item = await StockItem.create({
      company: req.user.company,
      category,
      name,
      quantity: Number(quantity) || 0,
      notes,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to add item", error: err.message });
  }
});

// @route  PUT /api/stock/:id
router.put("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  const item = await StockItem.findOne({ _id: req.params.id, company: req.user.company });
  if (!item) return res.status(404).json({ message: "Item not found" });

  const { category, name, quantity, notes } = req.body;
  if (category !== undefined) item.category = category;
  if (name !== undefined) item.name = name;
  if (quantity !== undefined) item.quantity = Math.max(0, Number(quantity));
  if (notes !== undefined) item.notes = notes;
  await item.save();
  res.json(item);
});

// @route  DELETE /api/stock/:id
router.delete("/:id", protect, checkLicense, adminOnly, async (req, res) => {
  await StockItem.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  res.json({ message: "Item removed" });
});

module.exports = router;
