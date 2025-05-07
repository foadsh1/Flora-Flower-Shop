const express = require("express");
const db = require("../models/db");
const router = express.Router();

// ✅ Get all users
router.get("/users", async (req, res) => {
  try {
    const [users] = await db.promise().query("SELECT * FROM users");
    res.json({ users });
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update user status
router.patch("/users/:user_id/status", async (req, res) => {
  const { user_id } = req.params;
  const { status } = req.body;
  try {
    await db
      .promise()
      .query("UPDATE users SET status = ? WHERE user_id = ?", [
        status,
        user_id,
      ]);
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("❌ Failed to update status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get all coupons
router.get("/coupons", async (req, res) => {
  try {
    const [coupons] = await db
      .promise()
      .query("SELECT * FROM coupons ORDER BY expires_at DESC");
    res.json({ coupons });
  } catch (err) {
    console.error("❌ Failed to fetch coupons:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add new coupon
router.post("/coupons", async (req, res) => {
  const { code, discount_percent, expires_at } = req.body;
  try {
    await db
      .promise()
      .query(
        "INSERT INTO coupons (code, discount_percent, expires_at, is_active) VALUES (?, ?, ?, 1)",
        [code, discount_percent, expires_at]
      );
    res.json({ message: "Coupon added" });
  } catch (err) {
    console.error("❌ Failed to add coupon:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Toggle coupon status
router.patch("/coupons/:coupon_id/status", async (req, res) => {
  const { coupon_id } = req.params;
  const { is_active } = req.body;
  try {
    await db
      .promise()
      .query("UPDATE coupons SET is_active = ? WHERE coupon_id = ?", [
        is_active ? 1 : 0,
        coupon_id,
      ]);
    res.json({ message: "Coupon status updated" });
  } catch (err) {
    console.error("❌ Failed to update coupon status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get current tax percent
router.get("/tax", async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT value, last_updated FROM settings WHERE key_name = 'tax_percent'"
      );
    const tax = rows[0]?.value || 17;
    const updatedAt = rows[0]?.last_updated || null;
    res.json({ tax: parseFloat(tax), updatedAt });
  } catch (err) {
    console.error("❌ Failed to fetch tax:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update tax percent AND recalculate product prices directly
router.patch("/tax", async (req, res) => {
  const { tax_percent } = req.body;
  if (!tax_percent || isNaN(tax_percent)) {
    return res.status(400).json({ error: "Invalid tax value" });
  }

  const conn = db.promise();
  try {
    // Get current tax value
    const [oldRows] = await conn.query(
      "SELECT value FROM settings WHERE key_name = 'tax_percent'"
    );
    const oldTax = parseFloat(oldRows[0]?.value || 0);

    // Save the new tax value
    await conn.query(
      `INSERT INTO settings (key_name, value)
       VALUES ('tax_percent', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [tax_percent]
    );

    // Recalculate each product price based on old tax and apply new tax
    // Reverse old tax first, then apply new tax
    await conn.query(`
      UPDATE products
      SET price = ROUND(price / (1 + ? / 100) * (1 + ? / 100), 2)
    `, [oldTax, tax_percent]);

    res.json({ message: "Tax updated and product prices recalculated." });
  } catch (err) {
    console.error("❌ Failed to update tax and prices:", err);
    res.status(500).json({ error: "Server error" });
  }
});



module.exports = router;
