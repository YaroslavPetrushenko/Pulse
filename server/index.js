const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const path = require("path");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");

const config = require("./config");
const usersRouter = require("./users");
const chatsRouter = require("./chats");
const messagesRouter = require("./messages");
const setupWebSocket = require("./ws");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// ✔ ПРАВИЛЬНЫЙ session middleware
app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.db",
      dir: process.cwd(),
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 дней
      secure: true,                    // обязательно для HTTPS
      sameSite: "none"                 // обязательно для fetch + credentials
    },
  })
);

app.use(express.static(path.join(__dirname, "..", "web")));

app.use("/api/users", usersRouter);
app.use("/api/chats", chatsRouter);
app.use("/api/messages", messagesRouter);

const { wss, broadcastMessage } = setupWebSocket(server);
app.locals.broadcastMessage = broadcastMessage;

const PORT = process.env.PORT || config.port;
server.listen(PORT, () => {
  console.log(`Pulse server listening on port ${PORT}`);
});


