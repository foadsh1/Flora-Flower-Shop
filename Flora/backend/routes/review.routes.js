const express = require("express");
const db = require("../models/db");

const router = express.Router();

// ✅ POST /reviews - Add a new review
router.post("/", (req, res) => {
  const { shop_id, rating, comment } = req.body;
  const client_id = req.session?.user?.user_id;

  if (!client_id || req.session.user.role !== "client") {
    return res.status(403).json({ error: "Only clients can leave reviews." });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }

  const sql = `
    INSERT INTO reviews (client_id, shop_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [client_id, shop_id, rating, comment], (err) => {
    if (err) {
      console.error("❌ Failed to add review:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({ message: "Review submitted successfully" });
  });
});

router.get("/mine", (req, res) => {
  const client_id = req.session?.user?.user_id;

  if (!client_id || req.session.user.role !== "client") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  db.query(
    "SELECT shop_id FROM reviews WHERE client_id = ?",
    [client_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ reviews: results });
    }
  );
});
router.get("/averages", (req, res) => {
  const sql = `
    SELECT shop_id,
           ROUND(AVG(rating), 1) AS averageRating,
           COUNT(*) AS reviewCount
    FROM reviews
    GROUP BY shop_id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch averages:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ ratings: results }); // ✅ MUST BE 'ratings'
  });
});


// ✅ GET /reviews/:shop_id - Get all reviews for a shop
router.get("/:shop_id", (req, res) => {
  const shop_id = req.params.shop_id;

  const sql = `
    SELECT r.*, u.username
    FROM reviews r
    JOIN users u ON r.client_id = u.user_id
    WHERE r.shop_id = ?
    ORDER BY r.review_date DESC
  `;

  db.query(sql, [shop_id], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch reviews:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ reviews: results });
  });
});



module.exports = router;
