const sqlite3 = require("sqlite3").verbose();
const { DB_FILE } = require("./config");

const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      is_developer INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user1_id, user2_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
});

function getUserByPhone(phone) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE phone = ?", [phone], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function getOrCreateChat(userId, peerId) {
  return new Promise((resolve, reject) => {
    const a = Math.min(userId, peerId);
    const b = Math.max(userId, peerId);

    db.get(
      "SELECT * FROM chats WHERE user1_id = ? AND user2_id = ?",
      [a, b],
      (err, row) => {
        if (err) return reject(err);
        if (row) return resolve(row);

        const now = Date.now();
        db.run(
          "INSERT INTO chats (user1_id, user2_id, created_at) VALUES (?, ?, ?)",
          [a, b, now],
          function (err2) {
            if (err2) return reject(err2);
            db.get(
              "SELECT * FROM chats WHERE id = ?",
              [this.lastID],
              (err3, row2) => {
                if (err3) return reject(err3);
                resolve(row2);
              }
            );
          }
        );
      }
    );
  });
}

module.exports = {
  db,
  getUserByPhone,
  getUserByUsername,
  getUserById,
  getOrCreateChat
};
