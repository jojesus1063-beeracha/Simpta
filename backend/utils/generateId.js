const crypto = require("crypto");

const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

module.exports = { generateId };
