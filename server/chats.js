// server/chats.js
// Чаты: список, создание, личный чат

const db = require("./db");

// Личный чат всегда один
async function ensureSelfChat(userId) {
  const existing = await db.get(
    "SELECT id FROM chats WHERE owner_id = ? AND is_self = 1",
    [userId]
  );
  if (existing) return existing.id;

  const res = await db.run(
    "INSERT INTO chats (owner_id, peer_id, is_self, title) VALUES (?, NULL, 1, ?)",
    [userId, "Чат"] // ← НЕ «ЛИЧНЫЙ ЧАТ», а просто ЧАТ
  );
  return res.lastID;
}

// GET /api/chats
async function getChats(req, res) {
  try {
    const userId = req.user.id;

    // гарантируем личный чат
    await ensureSelfChat(userId);

    const rows = await db.all(
      `
      SELECT id, owner_id, peer_id, is_self, title
      FROM chats
      WHERE owner_id = ?
      ORDER BY id DESC
    `,
      [userId]
    );

    res.json(rows);
  } catch (e) {
    console.error("getChats error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

// POST /api/chats/with { peerId }
async function createOrGetChatWith(req, res) {
  try {
    const userId = req.user.id;
    const { peerId } = req.body || {};

    if (!peerId) {
      return res.status(400).json({ error: "peer_required" });
    }

    // Чат с самим собой
    if (Number(peerId) === Number(userId)) {
      const id = await ensureSelfChat(userId);
      const chat = await db.get(
        "SELECT id, owner_id, peer_id, is_self, title FROM chats WHERE id = ?",
        [id]
      );
      return res.json(chat);
    }

    // Ищем существующий
    let chat = await db.get(
      `
      SELECT id, owner_id, peer_id, is_self, title
      FROM chats
      WHERE owner_id = ? AND peer_id = ? AND is_self = 0
    `,
      [userId, peerId]
    );

    // Если нет — создаём
    if (!chat) {
      const resDb = await db.run(
        "INSERT INTO chats (owner_id, peer_id, is_self, title) VALUES (?, ?, 0, ?)",
        [userId, peerId, "Чат"]
      );
      chat = await db.get(
        "SELECT id, owner_id, peer_id, is_self, title FROM chats WHERE id = ?",
        [resDb.lastID]
      );
    }

    res.json(chat);
  } catch (e) {
    console.error("createOrGetChatWith error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

module.exports = {
  ensureSelfChat,
  getChats,
  createOrGetChatWith
};
