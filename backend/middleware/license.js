const Company = require("../models/Company");

const checkLicense = async (req, res, next) => {
  if (req.user.isSuperAdmin) return next();

  const company = await Company.findById(req.user.company);
  if (!company) return res.status(404).json({ message: "Company not found" });

  const now = new Date();
  const inTrial = company.licenseStatus === "trial" && company.trialEndsAt > now;
  const active = company.licenseStatus === "active" || inTrial;

  if (!active) {
    if (company.licenseStatus === "trial") {
      company.licenseStatus = "inactive";
      await company.save();
    }
    return res.status(402).json({
      message: "Your free trial has ended. Contact the workspace owner to activate your subscription.",
    });
  }

  req.company = company;
  next();
};

module.exports = { checkLicense };
