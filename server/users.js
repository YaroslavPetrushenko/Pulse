// users.js
import { dbGet, dbAll, dbRun } from "./db.js";
import { hashPassword } from "./utils.js";

export async function getUserByPhone(phone) {
  return dbGet("SELECT * FROM users WHERE phone = ?", [phone]);
}

export async function getUserById(id) {
  return dbGet("SELECT * FROM users WHERE id = ?", [id]);
}

export async function getUserByUsername(username) {
  return dbGet("SELECT * FROM users WHERE username = ?", [username]);
}

export async function createUser({ phone, name, username, password }) {
  const password_hash = await hashPassword(password);
  const res = await dbRun(
    "INSERT INTO users (phone, name, username, password_hash, is_developer) VALUES (?, ?, ?, ?, ?)",
    [phone, name, username, password_hash, username === "@&Developer&Official&" ? 1 : 0]
  );
  return getUserById(res.id);
}

export async function searchUsers(query) {
  const q = `%${query}%`;
  return dbAll(
    "SELECT id, name, username FROM users WHERE name LIKE ? OR username LIKE ? ORDER BY id DESC LIMIT 20",
    [q, q]
  );
}
