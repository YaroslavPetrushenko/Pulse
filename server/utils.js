const crypto = require("crypto");

function hashPassword(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

function normalizeUserPublic(u) {
  if (!u) return null;
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    username: u.username,
    isDeveloper: !!u.is_developer
  };
}

module.exports = {
  hashPassword,
  normalizeUserPublic
};
