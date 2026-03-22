// messages.js
import { dbAll, dbRun } from "./db.js";
import { now } from "./utils.js";
import { getChatById } from "./chats.js";
import { getUserById } from "./users.js";

export async function getMessagesForChat(chatId, userId) {
  // userId можно использовать для прав доступа, если нужно
  return dbAll(
    `
    SELECT id, chat_id, sender_id, text, created_at
    FROM messages
    WHERE chat_id = ?
    ORDER BY id ASC
  `,
    [chatId]
  );
}

export async function addMessage(chatId, senderId, text) {
  const chat = await getChatById(chatId);
  if (!chat) throw new Error("chat_not_found");

  const res = await dbRun(
    "INSERT INTO messages (chat_id, sender_id, text, created_at) VALUES (?, ?, ?, ?)",
    [chatId, senderId, text, now()]
  );

  const msg = await dbAll(
    "SELECT id, chat_id, sender_id, text, created_at FROM messages WHERE id = ?",
    [res.id]
  );

  return msg[0];
}

export async function searchMessages(userId, query) {
  const q = `%${query}%`;

  const rows = await dbAll(
    `
    SELECT m.id,
           m.chat_id,
           m.text,
           m.created_at,
           CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS peerId
    FROM messages m
    JOIN chats c ON c.id = m.chat_id
    WHERE (c.user1_id = ? OR c.user2_id = ?)
      AND m.text LIKE ?
    ORDER BY m.id DESC
    LIMIT 50
  `,
    [userId, userId, userId, q]
  );

  const result = [];
  for (const row of rows) {
    const peer = await getUserById(row.peerId);
    result.push({
      id: row.id,
      chatId: row.chat_id,
      text: row.text,
      created_at: row.created_at,
      peerName: peer?.name || "Пользователь",
      snippet: row.text.length > 80 ? row.text.slice(0, 77) + "..." : row.text
    });
  }

  return result;
}
