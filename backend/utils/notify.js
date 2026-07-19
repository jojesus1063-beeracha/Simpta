const Notification = require("../models/Notification");
const User = require("../models/User");

// Notifies every user in a company except the person who triggered it
const notifyCompany = async ({ companyId, excludeUserId, type, message, link }) => {
  const users = await User.find({ company: companyId, _id: { $ne: excludeUserId } }).select("_id");
  if (users.length === 0) return;
  await Notification.insertMany(
    users.map((u) => ({ company: companyId, user: u._id, type, message, link }))
  );
};

const notifyUser = async ({ companyId, userId, type, message, link }) => {
  await Notification.create({ company: companyId, user: userId, type, message, link });
};

module.exports = { notifyCompany, notifyUser };
