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
// ✅ Get all orders of the logged-in client
router.get("/mine", (req, res) => {
  const client_id = req.session?.user?.user_id;

  if (!client_id) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const sql = `
    SELECT o.order_id, o.order_date, o.total_price, o.status, oi.quantity, oi.price AS item_price,
           p.name AS product_name, p.image AS product_image
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE o.client_id = ?
    ORDER BY o.order_date DESC
  `;

  db.query(sql, [client_id], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch orders:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ orders: results });
  });
});// ✅ Update order status by shop owner
router.patch("/:id/status", (req, res) => {
  const order_id = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  db.query(
    "UPDATE orders SET status = ? WHERE order_id = ?",
    [status, order_id],
    (err, result) => {
      if (err) {
        console.error("❌ Failed to update order status:", err);
        return res.status(500).json({ error: "Failed to update order status" });
      }
      res.json({ message: "Order status updated successfully!" });
    }
  );
});

module.exports = router;
