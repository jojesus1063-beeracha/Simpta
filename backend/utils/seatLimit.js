const User = require("../models/User");
const Company = require("../models/Company");

// Returns { ok: true } or { ok: false, message } depending on whether the
// company has room for one more user account under its current license tier.
// trial and unlimited tiers have no cap (maxUsers is null).
const checkSeatAvailable = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company || company.maxUsers == null) return { ok: true };

  const currentCount = await User.countDocuments({ company: companyId });
  if (currentCount >= company.maxUsers) {
    return {
      ok: false,
      message: `This workspace's plan (${company.licenseTier} users) is full. Contact your account owner to upgrade.`,
    };
  }
  return { ok: true };
};

module.exports = { checkSeatAvailable };
