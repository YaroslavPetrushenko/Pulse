// chats.js
import { dbGet, dbAll, dbRun } from "./db.js";
import { now } from "./utils.js";
import { getUserById } from "./users.js";

export async function getOrCreateChat(user1, user2) {
  const existing = await dbGet(
    `
    SELECT * FROM chats
    WHERE (user1_id = ? AND user2_id = ?)
       OR (user1_id = ? AND user2_id = ?)
  `,
    [user1, user2, user2, user1]
  );
  if (existing) return existing;

  const res = await dbRun(
    "INSERT INTO chats (user1_id, user2_id, created_at) VALUES (?, ?, ?)",
    [user1, user2, now()]
  );
  return getChatById(res.id);
}

export async function getChatById(id) {
  return dbGet("SELECT * FROM chats WHERE id = ?", [id]);
}

export async function getChatsForUser(userId) {
  const rows = await dbAll(
    `
    SELECT c.id,
           CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS peerId
    FROM chats c
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY c.id DESC
  `,
    [userId, userId, userId]
  );

  const result = [];
  for (const row of rows) {
    const peer = await getUserById(row.peerId);
    if (!peer) continue;

    const lastMsg = await dbGet(
      "SELECT text, created_at FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT 1",
      [row.id]
    );

    result.push({
      id: row.id,
      peerId: row.peerId,
      name: peer.name,
      peerUsername: peer.username,
      lastMessage: lastMsg?.text || "",
      lastTime: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      unread: 0
    });
  }

  return result;
}
