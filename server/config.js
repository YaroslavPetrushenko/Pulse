const path = require("path");

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_FILE: path.join(__dirname, "..", "cloud.db"),
  STATIC_DIR: path.join(__dirname, "..", "web")
};
