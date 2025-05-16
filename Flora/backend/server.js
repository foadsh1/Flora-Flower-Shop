const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const path = require("path");
const ordersRoutes = require("./routes/orders.routes");
const authRoutes = require("./routes/auth.routes");
const shopRoutes = require("./routes/shop.routes");
const productsRoutes = require("./routes/products.routes");
const app = express();
const reviewRoutes = require("./routes/review.routes");
const supplierRoutes = require("./routes/supplier.routes");
const contactRoutes = require("./routes/contact.routes");
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session setup
app.use(
  cookieSession({
    name: "session",
    keys: ["super-secret-key"],
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax" // or "none" + secure: true if using HTTPS
  })
);
app.use("/admin", require("./routes/admin.routes")); // ✅ Admin routes

// ✅ Static image folder
app.use("/uploads", express.static("uploads", {
  setHeaders: (res, path) => {
    res.set("Access-Control-Allow-Origin", "*");
  }
}));
app.use("/products", productsRoutes);
// ✅ Routes
app.use("/auth", authRoutes);
app.use("/shop", shopRoutes);
app.use("/orders", ordersRoutes);
app.use("/reviews", reviewRoutes);
app.use("/supplier", supplierRoutes);
app.use("/contact", contactRoutes);
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
