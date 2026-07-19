const mongoose = require("mongoose");

const photoBoxItemSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    url: { type: String, required: true },
    caption: { type: String, default: "" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhotoBoxItem", photoBoxItemSchema);
