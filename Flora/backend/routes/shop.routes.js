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
router.get("/analytics", (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const user_id = user.user_id;
  const { from, to, year1, year2, limit = 5 } = req.query;

  db.query(
    "SELECT shop_id FROM shops WHERE user_id = ?",
    [user_id],
    (err, shopResult) => {
      if (err || shopResult.length === 0) {
        return res.status(500).json({ error: "Shop lookup failed" });
      }

      const shop_id = shopResult[0].shop_id;

      const topFlowerSql = `
      SELECT p.name, SUM(oi.quantity) AS totalSold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.shop_id = ? AND o.status = 'Delivered' 
        AND o.order_date BETWEEN ? AND ?
      GROUP BY oi.product_id
      ORDER BY totalSold DESC
      LIMIT ?
    `;

      const monthlyRevenueSql = `
      SELECT 
        m.month_num,
        m.month_name,
        IFNULL(SUM(o.total_price), 0) AS revenue
      FROM (
        SELECT 1 AS month_num, 'Jan' AS month_name UNION ALL
        SELECT 2, 'Feb' UNION ALL
        SELECT 3, 'Mar' UNION ALL
        SELECT 4, 'Apr' UNION ALL
        SELECT 5, 'May' UNION ALL
        SELECT 6, 'Jun' UNION ALL
        SELECT 7, 'Jul' UNION ALL
        SELECT 8, 'Aug' UNION ALL
        SELECT 9, 'Sep' UNION ALL
        SELECT 10, 'Oct' UNION ALL
        SELECT 11, 'Nov' UNION ALL
        SELECT 12, 'Dec'
      ) m
      LEFT JOIN orders o ON MONTH(o.order_date) = m.month_num
        AND o.status = 'Delivered'
        AND o.shop_id = ?
        AND o.order_date BETWEEN ? AND ?
      GROUP BY m.month_num, m.month_name
      ORDER BY m.month_num
    `;

      db.query(
        topFlowerSql,
        [shop_id, from, to, parseInt(limit)],
        (err1, topFlowers) => {
          if (err1)
            return res.status(500).json({ error: "Top flower query failed" });

          db.query(
            monthlyRevenueSql,
            [shop_id, from, to],
            (err2, monthlyData) => {
              if (err2)
                return res
                  .status(500)
                  .json({ error: "Monthly revenue query failed" });

              const monthlyRevenue = monthlyData.map((row) => ({
                month: row.month_name,
                revenue: row.revenue,
              }));

              res.json({ topFlowers, monthlyRevenue });
            }
          );
        }
      );
    }
  );
});

router.get("/analytics/compare", (req, res) => {
  if (!req.session.user || req.session.user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const user_id = req.session.user.user_id;
  const { year1, year2 } = req.query;

  if (!year1 || !year2) {
    return res.status(400).json({ error: "Missing years for comparison" });
  }

  const sql = `
    SELECT 
      m.month_num,
      m.month_name,
      IFNULL(SUM(CASE WHEN YEAR(o.order_date) = ? THEN o.total_price END), 0) AS year1_revenue,
      IFNULL(SUM(CASE WHEN YEAR(o.order_date) = ? THEN o.total_price END), 0) AS year2_revenue
    FROM (
      SELECT 1 AS month_num, 'Jan' AS month_name UNION ALL
      SELECT 2, 'Feb' UNION ALL
      SELECT 3, 'Mar' UNION ALL
      SELECT 4, 'Apr' UNION ALL
      SELECT 5, 'May' UNION ALL
      SELECT 6, 'Jun' UNION ALL
      SELECT 7, 'Jul' UNION ALL
      SELECT 8, 'Aug' UNION ALL
      SELECT 9, 'Sep' UNION ALL
      SELECT 10, 'Oct' UNION ALL
      SELECT 11, 'Nov' UNION ALL
      SELECT 12, 'Dec'
    ) m
    LEFT JOIN orders o ON MONTH(o.order_date) = m.month_num
      AND o.status = 'Delivered'
      AND o.shop_id IN (
        SELECT shop_id FROM shops WHERE user_id = ?
      )
      AND YEAR(o.order_date) IN (?, ?)
    GROUP BY m.month_num, m.month_name
    ORDER BY m.month_num;
  `;

  db.query(sql, [year1, year2, user_id, year1, year2], (err, results) => {
    if (err) {
      console.error("Compare revenue error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const comparison = results.map((row) => ({
      month: row.month_name,
      [year1]: row.year1_revenue,
      [year2]: row.year2_revenue,
    }));

    res.json({ comparison });
  });
});
router.get("/coupons", async (req, res) => {
  const user_id = req.session?.user?.user_id;
  if (!user_id) return res.status(403).json({ error: "Unauthorized" });

  try {
    const [shop] = await db
      .promise()
      .query("SELECT shop_id FROM shops WHERE user_id = ?", [user_id]);

    if (shop.length === 0)
      return res.status(404).json({ error: "Shop not found" });

    const shop_id = shop[0].shop_id;
    const [coupons] = await db
      .promise()
      .query(
        "SELECT * FROM coupons WHERE shop_id = ? ORDER BY expires_at DESC",
        [shop_id]
      );

    res.json({ coupons });
  } catch (err) {
    console.error("❌ Failed to fetch shop coupons:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/coupons", async (req, res) => {
  const user_id = req.session?.user?.user_id;
  if (!user_id) return res.status(403).json({ error: "Unauthorized" });

  const { code, discount_percent, expires_at } = req.body;

  try {
    const [shop] = await db
      .promise()
      .query("SELECT shop_id FROM shops WHERE user_id = ?", [user_id]);

    if (shop.length === 0)
      return res.status(404).json({ error: "Shop not found" });

    const shop_id = shop[0].shop_id;

    await db
      .promise()
      .query(
        "INSERT INTO coupons (code, discount_percent, expires_at, is_active, shop_id) VALUES (?, ?, ?, 1, ?)",
        [code, discount_percent, expires_at, shop_id]
      );

    res.json({ message: "Coupon added" });
  } catch (err) {
    console.error("❌ Failed to add coupon:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Toggle coupon status (shopowner can only modify their coupons)
router.patch("/coupons/:coupon_id/status", async (req, res) => {
  const user = req.session?.user;
  const { coupon_id } = req.params;
  const { is_active } = req.body;

  if (!user || user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const [[shop]] = await db
      .promise()
      .query("SELECT shop_id FROM shops WHERE user_id = ?", [user.user_id]);

    if (!shop) return res.status(404).json({ error: "Shop not found" });

    const [[coupon]] = await db
      .promise()
      .query(
        "SELECT * FROM coupons WHERE coupon_id = ? AND shop_id = ?",
        [coupon_id, shop.shop_id]
      );

    if (!coupon) return res.status(403).json({ error: "Unauthorized coupon" });

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
router.get("/coupon/validate", async (req, res) => {
  const { code } = req.query;
  const user_id = req.session?.user?.user_id;

  if (!code || !user_id) {
    return res
      .status(400)
      .json({ error: "Missing coupon code or not logged in." });
  }

  try {
    // Get the shop_id based on the user
    const [[shop]] = await db
      .promise()
      .query("SELECT shop_id FROM shops WHERE user_id = ?", [user_id]);

    if (!shop) {
      return res.status(404).json({ error: "Shop not found for user." });
    }

    const shop_id = shop.shop_id;

    const [rows] = await db.promise().query(
      `SELECT * FROM coupons 
         WHERE code = ? AND shop_id = ? 
         AND is_active = 1 AND expires_at > NOW()`,
      [code, shop_id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Coupon not found, expired, or not for your shop." });
    }

    return res.json({ discount: rows[0].discount_percent });
  } catch (err) {
    console.error("❌ Coupon validation error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
