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

  if (!["active", "unactive"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
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


// ✅ Get all coupons
router.get("/coupons", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  db.query("SELECT * FROM coupons ORDER BY expires_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ coupons: results });
  });
});

// ✅ Create a new coupon
router.post("/coupons", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { code, discount_percent, expires_at } = req.body;

  if (!code || !discount_percent || !expires_at) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO coupons (code, discount_percent, expires_at)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [code, discount_percent, expires_at], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Coupon code already exists" });
      }
      return res.status(500).json({ error: "Failed to create coupon" });
    }
    res.json({ message: "Coupon created successfully" });
  });
});

// ✅ Toggle coupon active status
router.patch("/coupons/:id/status", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const couponId = req.params.id;
  const { is_active } = req.body;

  db.query(
    "UPDATE coupons SET is_active = ? WHERE coupon_id = ?",
    [is_active ? 1 : 0, couponId],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to update status" });
      res.json({ message: "Coupon status updated" });
    }
  );
});

module.exports = router;
