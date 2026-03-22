// server/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// путь к базе
const dbPath = path.join(__dirname, "..", "cloud.db");

// создаём подключение
const db = new sqlite3.Database(dbPath);

// удобные промисы
db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

module.exports = db;
