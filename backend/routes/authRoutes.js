const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { register, login, getMe, updateMe } = require("../controllers/authController");

// public routes
router.post("/register", register);
router.post("/login", login);

// authenticated routes
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);

module.exports = router;
