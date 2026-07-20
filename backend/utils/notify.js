const Notification = require("../models/Notification");
const User = require("../models/User");

// Notifies every user in a company except the person who triggered it
// (and optionally a list of others, e.g. people already notified directly)
const notifyCompany = async ({ companyId, excludeUserId, excludeUserIds = [], type, message, link }) => {
  const excluded = [String(excludeUserId), ...excludeUserIds.map(String)];
  const users = await User.find({ company: companyId, _id: { $nin: excluded } }).select("_id");
  if (users.length === 0) return;
  await Notification.insertMany(
    users.map((u) => ({ company: companyId, user: u._id, type, message, link }))
  );
};

const notifyUser = async ({ companyId, userId, type, message, link }) => {
  await Notification.create({ company: companyId, user: userId, type, message, link });
};

module.exports = { notifyCompany, notifyUser };
