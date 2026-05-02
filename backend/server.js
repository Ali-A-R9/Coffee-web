const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const seedAdminUser = require("./config/seedAdmin");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.send("CafeSite API is running...");
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "CafeSite API is healthy",
  });
});

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const cafeRoutes = require("./routes/cafeRoutes");
app.use("/api/cafes", cafeRoutes);

const menuRoutes = require("./routes/menuRoutes");
app.use("/api/menu", menuRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await seedAdminUser();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
