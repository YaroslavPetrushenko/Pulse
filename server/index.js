const express = require("express");
const session = require("express-session");
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

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(__dirname, "..", "web")));

app.use("/api/users", usersRouter);
app.use("/api/chats", chatsRouter);
app.use("/api/messages", messagesRouter);

const { wss, broadcastMessage } = setupWebSocket(server, null);
app.locals.broadcastMessage = broadcastMessage;

server.listen(config.port, () => {
  console.log(`Pulse server listening on port ${config.port}`);
});
