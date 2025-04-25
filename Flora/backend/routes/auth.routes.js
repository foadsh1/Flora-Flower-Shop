const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../models/db");

const router = express.Router();

const VALID_ROLES = ["client", "shopowner"]; // Only allow these roles from the frontend

// ✅ SIGN UP
router.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;

  // Basic field validation
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Invalid role provided." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists." });
      }

      db.query(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, role],
        (err) => {
          if (err)
            return res.status(500).json({ error: "Failed to register user" });
          return res
            .status(201)
            .json({ message: "User registered successfully" });
        }
      );
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ SIGN IN
router.post("/signin", (req, res) => {
  const { email, password } = req.body;

  console.log("🛠️ Login attempt:", email, password);

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("❌ DB Error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        console.warn("⚠️ No user found with email:", email);
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const user = results[0];
      console.log("✅ Found user:", user);
      if (user.status === "unactive") {
        return res
          .status(401)
          .json({ error: "Account is inactive. Contact admin." });
      }

      try {
        const match = await bcrypt.compare(password, user.password);
        console.log("🔍 Password match:", match);
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        console.log(user.password);
        console.log(hashedPassword === user.password);

        if (!match) {
          return res.status(401).json({ error: "Invalid credentials." });
        }

        const sessionUser = {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
        };

        req.session.user = sessionUser;

        if (user.role === "shopowner") {
          db.query(
            "SELECT * FROM shops WHERE user_id = ?",
            [user.user_id],
            (err, shopResults) => {
              if (err)
                return res.status(500).json({ error: "Shop lookup failed." });
              const hasShop = shopResults.length > 0;
              return res.json({ user: sessionUser, hasShop });
            }
          );
        } else {
          return res.json({ user: sessionUser });
        }
      } catch (e) {
        console.error("❌ bcrypt compare error:", e);
        return res.status(500).json({ error: "Login failed" });
      }
    }
  );
});

// ✅ SIGN OUT
router.post("/signout", (req, res) => {
  req.session = null;
  res.clearCookie("session");
  res.json({ message: "Logged out successfully" });
});

// ✅ CHECK SESSION
router.get("/me", (req, res) => {
  if (req.session?.user) {
    return res.json({ user: req.session.user });
  }
  return res.status(401).json({ error: "Not logged in" });
});

// ✅ GET PROFILE
router.get("/profile", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  res.json({ user: req.session.user });
});

// ✅ UPDATE PROFILE
router.patch("/profile", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const { username, email, phone, address } = req.body;
  const user_id = req.session.user.user_id;

  const sql = `
    UPDATE users
    SET username = ?, email = ?, phone = ?, address = ?
    WHERE user_id = ?
  `;

  db.query(sql, [username, email, phone, address, user_id], (err) => {
    if (err) {
      console.error("❌ Update failed:", err.sqlMessage || err.message || err);
      return res.status(500).json({ error: "Update failed" });
    }

    // ✅ Update session
    req.session.user = {
      ...req.session.user,
      username,
      email,
      phone,
      address,
    };

    return res.json({ message: "Profile updated", user: req.session.user });
  });
});

module.exports = router;
