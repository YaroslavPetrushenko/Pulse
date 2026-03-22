require("dotenv").config();

const config = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || "pulse-dev-secret",
  dbFile: process.env.DB_FILE || "cloud.db",
};

module.exports = config;
