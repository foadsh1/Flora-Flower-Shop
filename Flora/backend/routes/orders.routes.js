const express = require("express");
const db = require("../models/db");

const router = express.Router();

// ✅ Place an order with stock validation
router.post("/place", async (req, res) => {
  const { cart, totalPrice, shopId } = req.body;
  const client_id = req.session?.user?.user_id;

  if (!client_id) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    // Step 1: Check stock for each product
    for (const item of cart) {
      const [results] = await db
        .promise()
        .query("SELECT name, quantity FROM products WHERE product_id = ?", [item.product_id]);

      if (!results || results.length === 0) {
        return res.status(404).json({ error: `Product not found: ID ${item.product_id}` });
      }

      const product = results[0];
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          error: `Not enough stock for ${product.name} (requested: ${item.quantity}, available: ${product.quantity})`,
        });
      }
    }

    // Step 2: Create order
    const [orderResult] = await db
      .promise()
      .query("INSERT INTO orders (client_id, shop_id, total_price) VALUES (?, ?, ?)", [
        client_id,
        shopId,
        totalPrice,
      ]);
    const order_id = orderResult.insertId;

    // Step 3: Insert order items
    const itemsValues = cart.map((item) => [
      order_id,
      item.product_id,
      item.quantity,
      item.price,
    ]);
    await db
      .promise()
      .query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?", [
        itemsValues,
      ]);

    // Step 4: Update stock
    for (const item of cart) {
      await db
        .promise()
        .query(
          "UPDATE products SET quantity = quantity - ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
    }

    res.json({ message: "Order placed successfully!" });
  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({ error: "Something went wrong while placing your order" });
  }
});
// ✅ Get all orders of the logged-in client
router.get("/mine", (req, res) => {
  const client_id = req.session?.user?.user_id;

  if (!client_id) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const sql = `
  SELECT o.order_id, o.order_date, o.total_price, o.status,
         s.shop_id, s.shop_name,
         oi.quantity, oi.price AS item_price,
         p.name AS product_name, p.image AS product_image
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  JOIN products p ON oi.product_id = p.product_id
  JOIN shops s ON o.shop_id = s.shop_id
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
// ✅ GET /orders/:order_id/details
router.get("/:order_id/details", (req, res) => {
  const order_id = req.params.order_id;
  const user = req.session?.user;

  if (!user || user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const sql = `
    SELECT o.order_id, o.order_date, o.status, o.total_price,
           u.username AS client_name,
           p.name AS product_name, p.image, oi.quantity, oi.price AS item_price,
           r.rating, r.comment
    FROM orders o
    JOIN users u ON o.client_id = u.user_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    LEFT JOIN reviews r ON r.client_id = o.client_id AND r.shop_id = o.shop_id
    WHERE o.order_id = ?
  `;

  db.query(sql, [order_id], (err, results) => {
    if (err || results.length === 0) {
      console.error("❌ Order details error:", err);
      return res.status(500).json({ error: "Failed to load order" });
    }

    const base = results[0];
    const items = results.map((row) => ({
      name: row.product_name,
      image: row.image,
      quantity: row.quantity,
      price: row.item_price,
    }));

    const response = {
      order_id: base.order_id,
      order_date: base.order_date,
      status: base.status,
      total_price: base.total_price,
      client_name: base.client_name,
      items,
      review: base.rating ? {
        rating: base.rating,
        comment: base.comment,
      } : null
    };

    res.json(response);
  });
});

module.exports = router;
