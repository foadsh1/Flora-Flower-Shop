const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const shopRoutes = require("./routes/shop.routes");

const app = express();

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/shop", shopRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
