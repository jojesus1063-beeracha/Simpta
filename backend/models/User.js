const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "member", "teacher", "student"], default: "member" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    isSuperAdmin: { type: Boolean, default: false },
    webSessionId: { type: String, default: null },
    appSessionId: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    company: this.company,
    isSuperAdmin: this.isSuperAdmin,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
