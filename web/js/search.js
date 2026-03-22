// search.js
// Поиск по пользователям и сообщениям

import { apiFindUser, apiSearchMessages } from "./api.js";
import { state } from "./state.js";
import { saveSearchHistory } from "./storage.js";

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

export function initSearch() {
  searchInput.oninput = onSearch;
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
  const arr = state.searchHistory.filter(x => x !== q);
  arr.push(q);
  const last5 = arr.slice(-5);
  state.searchHistory = last5;
  saveSearchHistory(last5);
}

function renderHistory() {
  searchResults.innerHTML = `
    <div class="search-section-title">История</div>
    ${state.searchHistory
      .map(q => `<div class="search-item"><div class="search-item-main">${q}</div></div>`)
      .join("")}
  `;
}

function renderResults(users, messages) {
  searchResults.innerHTML = "";

  if (users.length) {
    searchResults.innerHTML += `<div class="search-section-title">Пользователи</div>`;
    for (const u of users) {
      searchResults.innerHTML += `
        <div class="search-item">
          <div class="search-item-avatar">${u.name[0]}</div>
          <div class="search-item-main">
            <div class="search-item-name">${u.name}</div>
            <div class="search-item-username">${u.username}</div>
          </div>
        </div>
      `;
    }
  }

  if (messages.length) {
    searchResults.innerHTML += `<div class="search-section-title">Сообщения</div>`;
    for (const m of messages) {
      searchResults.innerHTML += `
        <div class="search-item">
          <div class="search-item-main">
            <div class="search-item-name">${m.peerName}</div>
            <div class="search-item-snippet">${m.snippet}</div>
          </div>
        </div>
      `;
    }
  }
}
