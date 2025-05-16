const express = require("express");
const router = express.Router();
const db = require("../models/db");

// 📨 Submit message to admin (client/shopowner)
router.post("/message", async (req, res) => {
  const user = req.session?.user;
  const { subject, category, message } = req.body;

  if (!user) return res.status(403).json({ error: "Unauthorized" });

  try {
    await db
      .promise()
      .query(
        `INSERT INTO messages (sender_id, role, subject, category, message, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [user.user_id, user.role, subject, category || "", message]
      );
    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔁 Admin fetches all messages
router.get("/admin/messages", async (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  try {
    const [messages] = await db
      .promise()
      .query(
        `SELECT m.*, u.username FROM messages m
         JOIN users u ON m.sender_id = u.user_id
         ORDER BY m.created_at DESC`
      );
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// ✏️ Admin replies to message
router.patch("/admin/messages/:id/reply", async (req, res) => {
  const user = req.session?.user;
  const { id } = req.params;
  const { response } = req.body;

  if (!user || user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  try {
    await db
      .promise()
      .query(
        `UPDATE messages
         SET response = ?, status = 'responded', responded_at = NOW(), is_read = 0
         WHERE message_id = ?`,
        [response, id]
      );
    res.json({ message: "Reply sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

// 🔔 Combined unread count for messages + warnings + coupons
router.get("/unread-count", async (req, res) => {
  const user = req.session?.user;
  if (!user) return res.status(403).json({ error: "Unauthorized" });

  try {
    const [[{ msgCount }]] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS msgCount FROM messages
         WHERE sender_id = ? AND status = 'responded' AND is_read = 0`,
        [user.user_id]
      );

    const [[{ warnCount }]] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS warnCount FROM warnings
         WHERE user_id = ? AND is_read = 0`,
        [user.user_id]
      );

    const [[{ couponCount }]] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS couponCount FROM coupon_messages
         WHERE client_id = ? AND is_read = 0`,
        [user.user_id]
      );

    res.json({
      unreadMessages: msgCount,
      unreadWarnings: warnCount,
      unreadCoupons: couponCount,
      totalUnread: msgCount + warnCount + couponCount,
    });
  } catch (err) {
    console.error("❌ Failed to fetch unread counts:", err);
    res.status(500).json({ error: "Failed to count unread items" });
  }
});

// 🔔 Count unread user messages (for admin only)
router.get("/admin/unread-count", async (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const [[{ count }]] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS count FROM messages WHERE status = 'pending'`
      );

    res.json({ unreadCount: count });
  } catch (err) {
    console.error("❌ Failed to get unread admin count:", err);
    res.status(500).json({ error: "Failed to count admin messages" });
  }
});


// ✅ Mark messages as read when viewed
router.patch("/messages/mark-read", async (req, res) => {
  const user = req.session?.user;
  if (!user) return res.status(403).json({ error: "Unauthorized" });

  try {
    await db
      .promise()
      .query(
        `UPDATE messages SET is_read = 1 WHERE sender_id = ? AND status = 'responded'`,
        [user.user_id]
      );
    res.json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

// 📜 Get all replies for client/shopowner
router.get("/messages/my-replies", async (req, res) => {
  const user = req.session?.user;
  if (!user) return res.status(403).json({ error: "Unauthorized" });

  try {
    const [messages] = await db
      .promise()
      .query(
        `SELECT * FROM messages
         WHERE sender_id = ? AND response IS NOT NULL
         ORDER BY responded_at DESC`,
        [user.user_id]
      );
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch replies" });
  }
});

// ⚠️ Admin issues warning
router.post("/warnings", async (req, res) => {
  const { user_id, reason } = req.body;
  try {
    await db
      .promise()
      .query(
        "INSERT INTO warnings (user_id, reason, is_read) VALUES (?, ?, 0)",
        [user_id, reason]
      );

    const [[{ count }]] = await db
      .promise()
      .query(
        "SELECT COUNT(*) AS count FROM warnings WHERE user_id = ?",
        [user_id]
      );

    res.json({ message: "Warning added", warningCount: count });
  } catch (err) {
    res.status(500).json({ error: "Failed to add warning" });
  }
});

// ⚠️ Client fetches their warnings
router.get("/my-warnings", async (req, res) => {
  const user = req.session?.user;
  if (!user) return res.status(403).json({ error: "Unauthorized" });

  try {
    const [warnings] = await db
      .promise()
      .query(
        `SELECT warning_id, reason, issued_at, is_read
         FROM warnings
         WHERE user_id = ?
         ORDER BY issued_at DESC`,
        [user.user_id]
      );

    res.json({ warnings });

    // 🔄 Mark as read AFTER sending
    await db
      .promise()
      .query(`UPDATE warnings SET is_read = 1 WHERE user_id = ?`, [
        user.user_id,
      ]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch warnings" });
  }
});

// 📬 Get coupon messages for client (with shop name)
router.get("/coupon-messages", async (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== "client") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const [messages] = await db.promise().query(
      `SELECT cm.message_id, cm.message, cm.sent_at,cm.is_read, c.code, c.discount_percent,c.expires_at, s.shop_name
         FROM coupon_messages cm
         JOIN coupons c ON cm.coupon_id = c.coupon_id
         JOIN shops s ON c.shop_id = s.shop_id
         WHERE cm.client_id = ?
         ORDER BY cm.sent_at DESC`,
      [user.user_id]
    );

    res.json({ messages });
  } catch (err) {
    console.error("❌ Failed to fetch coupon messages:", err);
    res.status(500).json({ error: "Failed to load coupon messages" });
  }
});

// ✅ Mark coupon messages as read
router.patch("/coupon-messages/mark-read", async (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== "client") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    await db
      .promise()
      .query(
        `UPDATE coupon_messages
         SET is_read = 1
         WHERE client_id = ? AND is_read = 0`,
        [user.user_id]
      );

    res.json({ message: "Coupon messages marked as read" });
  } catch (err) {
    console.error("❌ Failed to mark coupon messages as read:", err);
    res.status(500).json({ error: "Failed to update read status" });
  }
});

module.exports = router;