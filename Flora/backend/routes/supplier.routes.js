const express = require("express");
const router = express.Router();
const db = require("../models/db"); // adjust if your db file path is different

// ✅ Place supplier restock order
router.post("/order", async (req, res) => {
  const user = req.session?.user;
  const items = req.body.items;

  if (!user || user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items to restock." });
  }

  try {
    const [shopRows] = await db
      .promise()
      .query("SELECT shop_id FROM shops WHERE user_id = ?", [user.user_id]);

    if (shopRows.length === 0) {
      return res.status(404).json({ error: "Shop not found for this user." });
    }

    const shop_id = shopRows[0].shop_id;

    for (const item of items) {
      if (!item.product_id || !item.restockQuantity || item.restockQuantity <= 0) continue;

      await db
        .promise()
        .query(
          "UPDATE products SET quantity = quantity + ? WHERE product_id = ? AND shop_id = ?",
          [item.restockQuantity, item.product_id, shop_id]
        );
    }

    res.json({ message: "Supplier order processed successfully." });
  } catch (err) {
    console.error("❌ Supplier order error:", err);
    res.status(500).json({ error: "Failed to process supplier order." });
  }
});

module.exports = router;
