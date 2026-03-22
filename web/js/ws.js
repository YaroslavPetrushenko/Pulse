const WS = (() => {
  let socket = null;
  let connected = false;
  const listeners = new Set();

  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const url = proto + "//" + location.host;

    socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      connected = true;
      listeners.forEach((fn) => fn({ type: "open" }));
    });

    socket.addEventListener("close", () => {
      connected = false;
      listeners.forEach((fn) => fn({ type: "close" }));
      setTimeout(connect, 3000);
    });

    socket.addEventListener("message", (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      listeners.forEach((fn) => fn(msg));
    });
  }

  function send(obj) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(obj));
  }

  function subscribeChat(chatId) {
    send({ type: "subscribe", chatId });
  }

  function onMessage(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return {
    connect,
    subscribeChat,
    onMessage,
  };
})();
