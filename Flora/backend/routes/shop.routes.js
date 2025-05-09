const express = require("express");
const db = require("../models/db");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ POST /shop/create
router.post("/create", upload.single("shop_image"), (req, res) => {
  if (!req.session.user || req.session.user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { shop_name, location, description } = req.body;
  const shop_image = req.file ? req.file.filename : null;
  const user_id = req.session.user.user_id;

  db.query(
    "INSERT INTO shops (shop_name, location, description, shop_image, user_id) VALUES (?, ?, ?, ?, ?)",
    [shop_name, location, description, shop_image, user_id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.status(201).json({ message: "Shop created successfully" });
    }
  );
});
router.get("/all", (req, res) => {
  db.query("SELECT * FROM shops", (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch shops:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ shops: results });
  });
});

// ✅ GET /shop/mine
router.get("/mine", (req, res) => {
  const user_id = req.session?.user?.user_id;

  if (!user_id) return res.status(403).json({ error: "Unauthorized" });

  db.query(
    "SELECT * FROM shops WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });

      if (results.length > 0) {
        res.json({ shop: results[0] }); // ✅ required for hasShop = true
      } else {
        res.json({ shop: null });
      }
    }
  );
});


// ✅ NEW: GET /shop/my-orders
router.get("/my-orders", (req, res) => {
  if (!req.session.user || req.session.user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const user_id = req.session.user.user_id;

  const sql = `
    SELECT o.order_id, o.order_date, o.status, u.username AS client_name
    FROM orders o
    JOIN users u ON o.client_id = u.user_id
    JOIN shops s ON o.shop_id = s.shop_id
    WHERE s.user_id = ?
    ORDER BY o.order_date DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("❌ Order fetch error:", err); // ✅ console log for debugging
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    res.json({ orders: results });
  });
});
// ✅ PATCH /shop/update
router.patch("/update", upload.single("shop_image"), (req, res) => {
  const { shop_name, location, description } = req.body;
  const shop_image = req.file ? req.file.filename : null;
  const user_id = req.session?.user?.user_id;

  if (!user_id) return res.status(403).json({ error: "Unauthorized" });

  let sql = `
    UPDATE shops
    SET shop_name = ?, location = ?, description = ?
    ${shop_image ? ", shop_image = ?" : ""}
    WHERE user_id = ?
  `;

  const values = shop_image
    ? [shop_name, location, description, shop_image, user_id]
    : [shop_name, location, description, user_id];

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: "Update failed" });
    return res.json({ message: "Shop updated successfully" });
  });
});
// ✅ GET all products of a specific shop
router.get("/:id/products", (req, res) => {
  const shop_id = req.params.id;

  db.query("SELECT * FROM products WHERE shop_id = ?", [shop_id], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch shop products:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ products: results });
  });
});
// ✅ GET /shop/analytics?days=30 (default 90)
router.get("/analytics", (req, res) => {
  if (!req.session.user || req.session.user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const user_id = req.session.user.user_id;
  const days = parseInt(req.query.days) || 90;

  // 1. Get shop_id for this shopowner
  const shopQuery = "SELECT shop_id FROM shops WHERE user_id = ?";
  db.query(shopQuery, [user_id], (err, shopResult) => {
    if (err || shopResult.length === 0) {
      return res.status(500).json({ error: "Shop not found or DB error" });
    }

    const shop_id = shopResult[0].shop_id;

    // 2. Top-selling flowers (limited to last X days)
    const topFlowersQuery = `
      SELECT p.name, SUM(oi.quantity) AS totalSold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.shop_id = ? AND o.status = 'Delivered'
        AND o.order_date >= CURDATE() - INTERVAL ? DAY
      GROUP BY oi.product_id
      ORDER BY totalSold DESC
      LIMIT 5
    `;

    // 3. Monthly revenue grouped by month + year (e.g. "Jan 2024")
    const monthlyRevenueQuery = `
      SELECT DATE_FORMAT(order_date, '%b %Y') AS month, SUM(total_price) AS revenue
      FROM orders
      WHERE shop_id = ? AND status = 'Delivered'
      GROUP BY YEAR(order_date), MONTH(order_date)
      ORDER BY YEAR(order_date), MONTH(order_date)
    `;

    db.query(topFlowersQuery, [shop_id, days], (err1, topFlowers) => {
      if (err1) {
        return res.status(500).json({ error: "Failed to load top flowers" });
      }

      db.query(monthlyRevenueQuery, [shop_id], (err2, monthlyRevenue) => {
        if (err2) {
          return res.status(500).json({ error: "Failed to load revenue" });
        }

        res.json({ topFlowers, monthlyRevenue });
      });
    });
  });
});



module.exports = router;
