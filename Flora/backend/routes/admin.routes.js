const express = require("express");
const router = express.Router();
const db = require("../models/db");

// ✅ Get all users
router.get("/users", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  db.query(
    "SELECT user_id, username, email, role, status FROM users",
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ users: results });
    }
  );
});

// ✅ Update user status
router.patch("/users/:id/status", (req, res) => {
  const { status } = req.body;
  const userId = req.params.id;

  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  db.query(
    "UPDATE users SET status = ? WHERE user_id = ?",
    [status, userId],
    (err) => {
      if (err) return res.status(500).json({ error: "Update failed" });
      res.json({ message: "User status updated" });
    }
  );
});

module.exports = router;
