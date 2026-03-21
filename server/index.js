const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const path = require("path");

const { PORT, STATIC_DIR } = require("./config");
const { registerUserRoutes } = require("./users");
const { registerChatRoutes } = require("./chats");
const { registerMessageRoutes } = require("./messages");
const { initWs } = require("./ws");

const app = express();
const server = http.createServer(app);

// middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(STATIC_DIR));

// API routes
registerUserRoutes(app);
registerChatRoutes(app);
registerMessageRoutes(app);

// WebSocket
initWs(server);

// SPA fallback (если нужно)
app.get("*", (req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

server.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
