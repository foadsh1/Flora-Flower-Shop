const express = require("express");
const db = require("../models/db");

const router = express.Router();

// ✅ Place an order
router.post("/place", (req, res) => {
  const { cart, totalPrice, shopId } = req.body;
  const client_id = req.session?.user?.user_id;

  if (!client_id) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Step 1: Create new order
  const orderSql = `
    INSERT INTO orders (client_id, shop_id, total_price)
    VALUES (?, ?, ?)
  `;
  db.query(orderSql, [client_id, shopId, totalPrice], (err, result) => {
    if (err) {
      console.error("❌ Order creation failed:", err);
      return res.status(500).json({ error: "Order creation failed" });
    }

    const order_id = result.insertId;

    // Step 2: Insert order items
    const itemsSql = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ?
    `;
    const itemsValues = cart.map((item) => [
      order_id,
      item.product_id,
      item.quantity,
      item.price,
    ]);

    db.query(itemsSql, [itemsValues], (err2) => {
      if (err2) {
        console.error("❌ Order items failed:", err2);
        return res.status(500).json({ error: "Order items failed" });
      }

      res.json({ message: "Order placed successfully!" });
    });
  });
});

module.exports = router;
