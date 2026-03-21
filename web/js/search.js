import { dom } from "./ui.js";
import { state, DEV_USERNAME } from "./state.js";
import { apiFindUser, apiSearchMessages } from "./api.js";
import { renderChatItemFromChat, selectChat, renderChatList } from "./chats.js";

export function renderSearchResults(chats, users, messages) {
  dom.chatListEl.innerHTML = "";

  if (!chats.length && !users.length && !messages.length) {
    dom.chatListEl.textContent = "Ничего не найдено";
    return;
  }

  if (users.length) {
    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = "Пользователи";
    dom.chatListEl.appendChild(label);

    users.forEach((u) => {
      const item = document.createElement("div");
      item.className = "chat-item";

      item.onclick = async () => {
        try {
          await openChatWithUserFromSearch(u);
        } catch (e) {
          console.error(e);
          alert("Ошибка при открытии чата");
        }
      };

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = (u.name || u.username || u.phone)[0];

      const meta = document.createElement("div");
      meta.className = "chat-meta";

      const top = document.createElement("div");
      top.className = "chat-top";

      const name = document.createElement("div");
      name.className = "chat-name";
      name.textContent = u.name || u.username || u.phone;

      const time = document.createElement("div");
      time.className = "chat-time";
      time.textContent = u.username ? "@" + u.username : u.phone;

      top.appendChild(name);
      top.appendChild(time);

      const bottom = document.createElement("div");
      bottom.className = "chat-bottom";

      if (u.username === DEV_USERNAME) {
        name.classList.add("chat-name-dev");
        bottom.textContent = "Создатель";
      } else if (u.username === "NatashaLove") {
        name.classList.add("chat-name-natasha");
        bottom.textContent = "Особенный пользователь";
      } else {
        name.classList.add("chat-name-normal");
        bottom.textContent = u.isDeveloper ? "Разработчик" : "Пользователь";
      }

      meta.appendChild(top);
      meta.appendChild(bottom);

      item.appendChild(avatar);
      item.appendChild(meta);

      dom.chatListEl.appendChild(item);
    });
  }

  if (chats.length) {
    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = "Чаты";
    dom.chatListEl.appendChild(label);

    chats.forEach((chat) => {
      dom.chatListEl.appendChild(renderChatItemFromChat(chat));
    });
  }

  if (messages.length) {
    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = "Сообщения";
    dom.chatListEl.appendChild(label);

    messages.forEach((m) => {
      const item = document.createElement("div");
      item.className = "chat-item";
      item.onclick = async () => {
        const chat = state.allChats.find((c) => c.id === m.chatId);
        if (chat) {
          await selectChat(chat);
        } else {
          await renderChatList();
          const updated = state.allChats.find((c) => c.id === m.chatId);
          if (updated) await selectChat(updated);
        }
      };

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = (m.peerName || "?")[0];

      const meta = document.createElement("div");
      meta.className = "chat-meta";

      const top = document.createElement("div");
      top.className = "chat-top";

      const name = document.createElement("div");
      name.className = "chat-name";
      name.textContent = m.peerName;

      if (m.peerUsername === DEV_USERNAME) {
        name.classList.add("chat-name-dev");
      }

      const time = document.createElement("div");
      time.className = "chat-time";
      time.textContent = m.peerUsername ? "@" + m.peerUsername : "";

      top.appendChild(name);
      top.appendChild(time);

      const bottom = document.createElement("div");
      bottom.className = "chat-bottom";
      bottom.textContent = m.snippet;

      meta.appendChild(top);
      meta.appendChild(bottom);

      item.appendChild(avatar);
      item.appendChild(meta);

      dom.chatListEl.appendChild(item);
    });
  }
}

async function openChatWithUserFromSearch(u) {
  const res = await fetch(
    CONFIG.API + "/api/chats?userId=" + state.currentUser.id
  );
  const existing = await res.json();

  let found = existing.find((c) => c.peerId === u.id);

  if (!found) {
    const createRes = await fetch(CONFIG.API + "/api/createChat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user1: state.currentUser.id, user2: u.id })
    });

    if (createRes.ok) {
      found = await createRes.json();
    } else {
      alert("Не удалось создать чат");
      return;
    }
  }

  state.allChats = existing;
  if (!state.allChats.find((c) => c.id === found.id)) {
    state.allChats.push(found);
  }

  await selectChat(found);
}

export async function handleSearchInput() {
  const q = dom.searchInput.value.trim();
  if (!q) {
    await renderChatList();
    return;
  }

  const lower = q.toLowerCase();

  const chatsFiltered = state.allChats.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(lower) ||
      (c.lastMessage || "").toLowerCase().includes(lower)
  );

  let users = [];
  let msgs = [];

  try {
    const [uRes, mRes] = await Promise.all([
      apiFindUser(q.startsWith("@") ? q.slice(1) : q),
      apiSearchMessages(state.currentUser.id, q)
    ]);

    users = uRes;
    msgs = mRes;
  } catch (e) {
    console.error(e);
  }

  renderSearchResults(chatsFiltered, users || [], msgs || []);
}
