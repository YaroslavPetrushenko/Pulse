const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("pulse.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      name TEXT,
      username TEXT UNIQUE,
      password_hash TEXT
    )
  `);
});

module.exports = db;
