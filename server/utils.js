// utils.js
import bcrypt from "bcryptjs";

export function now() {
  return Date.now();
}

export function normalizePhone(phone) {
  return phone.replace(/[^\d+]/g, "");
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
