const { db, getUserByPhone, getUserByUsername } = require("./db");
const { hashPassword, normalizeUserPublic } = require("./utils");

// /api/checkUser
function registerCheckUserRoute(app) {
  app.get("/api/checkUser", async (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.json({ exists: false });

    try {
      const user = await getUserByPhone(phone);
      res.json({ exists: !!user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  });
}

// /api/checkUsername
function registerCheckUsernameRoute(app) {
  app.get("/api/checkUsername", async (req, res) => {
    const u = (req.query.u || "").trim();
    if (!u) return res.json({ available: false });

    try {
      const user = await getUserByUsername(u);
      if (user) {
        return res.json({ available: false });
      }
      res.json({ available: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  });
}

// /api/register
function registerRegisterRoute(app) {
  app.post("/api/register", async (req, res) => {
    const { phone, name, username, password } = req.body || {};
    if (!phone || !name || !username || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    try {
      const existingPhone = await getUserByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ error: "user_exists" });
      }

      const existingUsername = await getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "username_taken" });
      }

      const now = Date.now();
      const hash = hashPassword(password);

      db.run(
        `INSERT INTO users (phone, name, username, password_hash, is_developer, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [phone, name, username, hash, now],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "server_error" });
          }
          const user = {
            id: this.lastID,
            phone,
            name,
            username,
            is_developer: 0
          };
          res.json({ user: normalizeUserPublic(user) });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  });
}

// /api/login
function registerLoginRoute(app) {
  app.post("/api/login", async (req, res) => {
    const { phone, password } = req.body || {};
    if (!phone || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    try {
      const user = await getUserByPhone(phone);
      if (!user) {
        return res.status(403).json({ error: "invalid_credentials" });
      }
      if (user.password_hash !== hashPassword(password)) {
        return res.status(403).json({ error: "invalid_credentials" });
      }
      res.json({ user: normalizeUserPublic(user) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "server_error" });
    }
  });
}

// /api/findUser
function registerFindUserRoute(app) {
  app.get("/api/findUser", (req, res) => {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const like = `%${q}%`;
    db.all(
      `
      SELECT id, phone, name, username, is_developer
      FROM users
      WHERE phone LIKE ? OR name LIKE ? OR username LIKE ?
      LIMIT 20
    `,
      [like, like, like],
      (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "server_error" });
        }
        res.json(rows.map(normalizeUserPublic));
      }
    );
  });
}

function registerUserRoutes(app) {
  registerCheckUserRoute(app);
  registerCheckUsernameRoute(app);
  registerRegisterRoute(app);
  registerLoginRoute(app);
  registerFindUserRoute(app);
}

module.exports = {
  registerUserRoutes
};
