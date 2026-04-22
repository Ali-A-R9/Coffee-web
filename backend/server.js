const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CafeSite API is running...");
});

const PORT = process.env.PORT || 5000;
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const cafeRoutes = require("./routes/cafeRoutes");
app.use("/api/cafes", cafeRoutes);

const menuRoutes = require("./routes/menuRoutes");
app.use("/api/menu", menuRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
