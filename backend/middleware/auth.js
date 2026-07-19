const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    // Enforce a single active session per platform (web / app). If this
    // account has logged in elsewhere on the same platform since this
    // token was issued, the stored session id will no longer match.
    const platform = decoded.platform === "app" ? "app" : "web";
    const currentSessionId = platform === "app" ? user.appSessionId : user.webSessionId;
    if (!decoded.sessionId || decoded.sessionId !== currentSessionId) {
      return res.status(401).json({
        message: "You've been signed out because this account was logged in on another device.",
        code: "SESSION_INVALIDATED",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid or expired token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { protect, adminOnly };
