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
  const { name, description, price, quantity } = req.body;
  const user_id = req.session?.user?.user_id;

  if (!user_id) return res.status(403).json({ error: "Unauthorized" });

  // find the shop_id of the logged-in user
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
        "INSERT INTO products (shop_id, name, description, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)",
        [shop_id, name, description, price, quantity, image],
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

// ✅ Update a product
router.patch("/:id", upload.single("image"), (req, res) => {
  const { name, description, price, quantity } = req.body;
  const image = req.file ? req.file.filename : null;
  const productId = req.params.id;

  let sql = `
    UPDATE products 
    SET name = ?, description = ?, price = ?, quantity = ?
    ${image ? ", image = ?" : ""}
    WHERE product_id = ?
  `;

  const values = image
    ? [name, description, price, quantity, image, productId]
    : [name, description, price, quantity, productId];

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
