const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");

const config = require("./config");
const usersRouter = require("./users");

const app = express();
const server = http.createServer(app);

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(bodyParser.json());

// SESSION
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
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: true,
      sameSite: "none",
    },
  })
);

// ROUTES
app.use("/api/users", usersRouter);

// STATIC FRONTEND
app.use(express.static(path.join(__dirname, "..", "web")));

// PORT (главное!)
const PORT = process.env.PORT || config.port;
server.listen(PORT, () => {
  console.log(`Pulse server listening on port ${PORT}`);
});
