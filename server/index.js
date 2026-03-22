const express = require("express");
const session = require("express-session");
const users = require("./users");
const chats = require("./chats");

const app = express();

app.use(express.json());
app.use(
  session({
    secret: "pulse-secret",
    resave: false,
    saveUninitialized: false
  })
);

// простая auth-прокладка
function auth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "unauthorized" });
  }
  req.user = { id: req.session.userId };
  next();
}

// AUTH
app.get("/api/checkUser", users.checkUser);
app.get("/api/checkUsername", users.checkUsername);
app.post("/api/register", users.register);
app.post("/api/login", users.login);

// CHATS
app.get("/api/chats", auth, chats.getChats);
app.post("/api/chats/with", auth, chats.createOrGetChatWith);

// USERS SEARCH
app.get("/api/users/search", auth, users.searchUsers);

module.exports = app;
