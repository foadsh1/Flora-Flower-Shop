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


module.exports = router;
