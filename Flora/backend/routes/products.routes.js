const express = require("express");
const db = require("../models/db");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// ✅ Multer setup for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ✅ Create a new product
router.post("/", upload.single("image"), (req, res) => {
  const { name, description, base_price, quantity, type } = req.body;
  const user_id = req.session?.user?.user_id;

  if (!user_id) return res.status(403).json({ error: "Unauthorized" });

  // ✅ Validate base_price
  const basePriceNum = parseFloat(base_price);
  if (isNaN(basePriceNum) || basePriceNum <= 0 || basePriceNum > 9999) {
    return res
      .status(400)
      .json({ error: "Invalid base price. Must be between 0.01 and 9999." });
  }

  // ✅ Validate quantity
  const quantityNum = parseInt(quantity);
  if (isNaN(quantityNum) || quantityNum < 0 || quantityNum > 9999) {
    return res
      .status(400)
      .json({
        error: "Invalid quantity. Must be a number between 0 and 9999.",
      });
  }

  if (!["single", "bouquet", "vase"].includes(type)) {
    return res
      .status(400)
      .json({ error: "Invalid product type. Must be 'single', 'bouquet', or 'vase'." });
  }

  // Get shop_id
  db.query(
    "SELECT shop_id FROM shops WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ error: "Shop not found" });
      }

      const shop_id = results[0].shop_id;
      const image = req.file ? req.file.filename : null;

      db.query(
        "INSERT INTO products (shop_id, name, description, base_price, quantity, image, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [shop_id, name, description, basePriceNum, quantityNum, image, type],
        (err) => {
          if (err)
            return res.status(500).json({ error: "Failed to add product" });
          res.json({ message: "Product added successfully" });
        }
      );
    }
  );
});

// ✅ Get all products for current shop
router.get("/mine", (req, res) => {
  const user_id = req.session?.user?.user_id;

  if (!user_id) return res.status(403).json({ error: "Unauthorized" });

  db.query(
    "SELECT shop_id FROM shops WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ error: "Shop not found" });
      }

      const shop_id = results[0].shop_id;

      db.query(
        "SELECT * FROM products WHERE shop_id = ?",
        [shop_id],
        (err, products) => {
          if (err)
            return res.status(500).json({ error: "Failed to fetch products" });
          res.json({ products });
        }
      );
    }
  );
});
// ✅ Get single product by ID (for editing)
router.get("/:id", (req, res) => {
  const user = req.session?.user;
  const productId = req.params.id;

  if (!user || user.role !== "shopowner") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // Get the shop_id of the logged-in user
  db.query(
    "SELECT shop_id FROM shops WHERE user_id = ?",
    [user.user_id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ error: "Shop not found" });
      }

      const shop_id = results[0].shop_id;

      // Ensure product belongs to that shop
      db.query(
        "SELECT * FROM products WHERE product_id = ? AND shop_id = ?",
        [productId, shop_id],
        (err, results) => {
          if (err) return res.status(500).json({ error: "Failed to fetch product" });
          if (results.length === 0) return res.status(404).json({ error: "Product not found" });

          res.json({ product: results[0] });
        }
      );
    }
  );
});
// ✅ Update a product
router.patch("/:id", upload.single("image"), (req, res) => {
  const { name, description, base_price, quantity, type } = req.body;
  const image = req.file ? req.file.filename : null;
  const productId = req.params.id;

  // ✅ Validate base_price
  const basePriceNum = parseFloat(base_price);
  if (isNaN(basePriceNum) || basePriceNum <= 0 || basePriceNum > 9999) {
    return res
      .status(400)
      .json({ error: "Invalid base price. Must be between 0.01 and 9999." });
  }

  // ✅ Validate quantity
  const quantityNum = parseInt(quantity);
  if (isNaN(quantityNum) || quantityNum < 0 || quantityNum > 9999) {
    return res
      .status(400)
      .json({
        error: "Invalid quantity. Must be a number between 0 and 9999.",
      });
  }

  // ✅ Validate type
  if (!["single", "bouquet", "vase"].includes(type)) {
    return res
      .status(400)
      .json({ error: "Invalid product type. Must be 'single', 'bouquet', or 'vase'." });
  }

  let sql = `
    UPDATE products 
    SET name = ?, description = ?, base_price = ?, quantity = ?, type = ?
    ${image ? ", image = ?" : ""}
    WHERE product_id = ?
  `;

  const values = image
    ? [name, description, basePriceNum, quantityNum, type, image, productId]
    : [name, description, basePriceNum, quantityNum, type, productId];

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: "Failed to update product" });
    res.json({ message: "Product updated successfully" });
  });
});

// ✅ Delete a product
router.delete("/:id", (req, res) => {
  const productId = req.params.id;

  db.query("DELETE FROM products WHERE product_id = ?", [productId], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete product" });
    res.json({ message: "Product deleted successfully" });
  });
});

module.exports = router;
