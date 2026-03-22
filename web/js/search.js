// search.js
// Поиск по пользователям и сообщениям

import { apiFindUser, apiSearchMessages } from "./api.js";
import { state } from "./state.js";
import { saveSearchHistory } from "./storage.js";
import { openChatWithUser } from "./chats.js";

let searchInput;
let searchResults;

export function initSearch() {
  searchInput = document.getElementById("searchInput");
  searchResults = document.getElementById("searchResults");

  if (!searchInput || !searchResults) return;

  searchInput.oninput = onSearch;

  if (state.searchHistory && state.searchHistory.length) {
    renderHistory();
  }
}

async function onSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    renderHistory();
    return;
  }

  try {
    const [users, messages] = await Promise.all([
      apiFindUser(q),
      apiSearchMessages(state.user.id, q)
    ]);

    updateHistory(q);
    renderResults(users, messages);
  } catch (e) {
    console.error("Ошибка поиска:", e);
  }
}

function updateHistory(q) {
  if (!q) return;
  const arr = (state.searchHistory || []).filter(x => x !== q);
  arr.push(q);
  const last5 = arr.slice(-5);
  state.searchHistory = last5;
  saveSearchHistory(last5);
}

function renderHistory() {
  if (!searchResults) return;

  searchResults.innerHTML = `
    <div class="search-section-title">История</div>
    ${(state.searchHistory || [])
      .map(
        q => `
      <div class="search-item">
        <div class="search-item-main">${q}</div>
      </div>`
      )
      .join("")}
  `;
}

function renderResults(users, messages) {
  if (!searchResults) return;

  searchResults.innerHTML = "";

  if (users && users.length) {
    const title = document.createElement("div");
    title.className = "search-section-title";
    title.textContent = "Пользователи";
    searchResults.appendChild(title);

    for (const u of users) {
      const el = document.createElement("div");
      el.className = "search-item";
      el.innerHTML = `
        <div class="search-item-avatar">${(u.name || u.username || "?")[0]}</div>
        <div class="search-item-main">
          <div class="search-item-name">${u.name || ""}</div>
          <div class="search-item-username">@${u.username}</div>
        </div>
      `;

      el.onclick = () => {
        if (u.id) {
          openChatWithUser(u.id);
        }
      };

      searchResults.appendChild(el);
    }
  }

  if (messages && messages.length) {
    const title = document.createElement("div");
    title.className = "search-section-title";
    title.textContent = "Сообщения";
    searchResults.appendChild(title);

    for (const m of messages) {
      const el = document.createElement("div");
      el.className = "search-item";
      el.innerHTML = `
        <div class="search-item-main">
          <div class="search-item-name">${m.peerName}</div>
          <div class="search-item-snippet">${m.snippet}</div>
        </div>
      `;
      searchResults.appendChild(el);
    }
  }

  if ((!users || !users.length) && (!messages || !messages.length)) {
    searchResults.innerHTML = `<div class="search-item">Ничего не найдено</div>`;
  }
}
