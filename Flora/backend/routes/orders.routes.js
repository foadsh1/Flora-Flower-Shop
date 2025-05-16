const express = require("express");
const db = require("../models/db");
const router = express.Router();

// ✅ Place a new order
router.post("/place", async (req, res) => {
  const {
    cart,
    totalPrice,
    shopId,
    couponCode,
    discount,
    method,
    date,
    time,
    address,
    phone,
  } = req.body;

  const client_id = req.session?.user?.user_id;
  if (!client_id) return res.status(403).json({ error: "Unauthorized" });

  try {
    const [[{ value: taxPercentStr }]] = await db
      .promise()
      .query("SELECT value FROM settings WHERE key_name = 'tax_percent'");
    const taxPercent = parseFloat(taxPercentStr) || 17;

    // Step 1: Validate stock
    for (const item of cart) {
      const [[product]] = await db
        .promise()
        .query("SELECT name, quantity FROM products WHERE product_id = ?", [item.product_id]);

      if (!product) return res.status(404).json({ error: `Product not found: ID ${item.product_id}` });

      if (product.quantity < item.cartQuantity) {
        return res.status(400).json({
          error: `Not enough stock for ${product.name} (requested: ${item.cartQuantity}, available: ${product.quantity})`,
        });
      }
    }

    // Step 2: Optional coupon validation
    if (couponCode) {
      const [couponResults] = await db
        .promise()
        .query("SELECT * FROM coupons WHERE code = ? AND is_active = TRUE AND expires_at > NOW()", [couponCode]);

      if (!couponResults || couponResults.length === 0) {
        return res.status(400).json({ error: "Invalid or expired coupon" });
      }

      const dbDiscount = couponResults[0].discount_percent;
      if (parseInt(dbDiscount) !== parseInt(discount)) {
        return res.status(400).json({ error: "Discount mismatch" });
      }
    }

    // Step 3: Insert order
    const [orderResult] = await db.promise().query(
      `INSERT INTO orders (
        client_id, shop_id, total_price, coupon_code, discount_applied, tax_percent,
        method, delivery_date, delivery_time, address_street, address_apt, address_city, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        shopId,
        totalPrice,
        couponCode || null,
        discount || 0,
        taxPercent,
        method,
        date || null,
        time || null,
        method === "delivery" ? address?.street : null,
        method === "delivery" ? address?.apt : null,
        method === "delivery" ? address?.city : null,
        method === "delivery" ? phone : null,
      ]
    );

    const order_id = orderResult.insertId;

    // Step 4: Insert order items
    const itemsValues = cart.map((item) => [
      order_id,
      item.product_id,
      item.cartQuantity,
      item.price,
    ]);
    await db
      .promise()
      .query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?", [itemsValues]);

    // Step 5: Update product stock
    for (const item of cart) {
      await db
        .promise()
        .query("UPDATE products SET quantity = quantity - ? WHERE product_id = ?", [
          item.cartQuantity,
          item.product_id,
        ]);
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
  if (!client_id) return res.status(403).json({ error: "Unauthorized" });

  const sql = `
    SELECT 
      o.order_id, o.order_date, o.total_price, o.status,
      o.method, o.delivery_date, o.delivery_time,
      o.address_street, o.address_apt, o.address_city, o.phone,
      o.coupon_code, o.discount_applied,o.tax_percent,
      s.shop_id, s.shop_name,
      oi.quantity AS order_quantity,
      oi.price AS order_price,
      p.name AS product_name,
      p.image AS product_image
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

    const grouped = {};
    for (const row of results) {
      if (!grouped[row.order_id]) {
        grouped[row.order_id] = {
          order_id: row.order_id,
          orderDate: row.order_date,
          status: row.status,
          totalPrice: row.total_price,
          shopId: row.shop_id,
          shopName: row.shop_name,
          method: row.method,
          deliveryDate: row.delivery_date,
          deliveryTime: row.delivery_time,
          coupon_code: row.coupon_code || null,
          discount_applied: row.discount_applied || 0,
          tax_percent: row.tax_percent || 17,
          address: row.method === "delivery"
            ? {
              street: row.address_street,
              apt: row.address_apt,
              city: row.address_city,
              phone: row.phone,
            }
            : null,
          products: [],
        };
      }

      grouped[row.order_id].products.push({
        name: row.product_name,
        image: row.product_image,
        quantity: row.order_quantity,
        price: row.order_price,
      });
    }

    res.json({ orders: Object.values(grouped) });
  });
});

// ✅ Update order status by shop owner
router.patch("/:id/status", (req, res) => {
  const order_id = req.params.id;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "Status is required" });

  db.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, order_id], (err) => {
    if (err) {
      console.error("❌ Failed to update order status:", err);
      return res.status(500).json({ error: "Failed to update order status" });
    }
    res.json({ message: "Order status updated successfully!" });
  });
});

// ✅ GET /orders/:order_id/details (for shop owner)
router.get("/:order_id/details", (req, res) => {
  const order_id = req.params.order_id;
  const user = req.session?.user;
  if (!user || user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const sql = `
    SELECT o.order_id, o.order_date, o.status, o.total_price,
           o.method, o.delivery_date, o.delivery_time,
           o.address_street, o.address_apt, o.address_city, o.phone,
           o.coupon_code, o.discount_applied, o.tax_percent,
           u.username AS client_name,
           p.name AS product_name, p.image,
           oi.quantity, oi.price AS item_price,
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
      coupon_code: base.coupon_code,
      discount_applied: base.discount_applied,
      tax_percent: base.tax_percent,
      method: base.method,
      delivery_date: base.delivery_date,
      delivery_time: base.delivery_time,
      address: base.method === "delivery"
        ? {
          street: base.address_street,
          apt: base.address_apt,
          city: base.address_city,
          phone: base.phone,
        }
        : null,
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

// ✅ Validate coupon
router.get("/coupon/validate", (req, res) => {
  const { code, shop_id } = req.query;

  const sql = `
    SELECT * FROM coupons
    WHERE code = ? AND shop_id = ? AND is_active = TRUE AND expires_at > NOW()
  `;

  db.query(sql, [code, shop_id], (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (results.length === 0) {
      return res.status(404).json({ error: "Invalid or expired coupon" });
    }

    const coupon = results[0];
    res.json({ discount: coupon.discount_percent });
  });
});

module.exports = router;
