const express = require("express");
const router = express.Router();

const {
  createCafe,
  getMyCafe,
  updateCafe,
  getAllCafes,
  getPublicCafes,
  updateCafeStatus,
} = require("../controllers/cafeController");

const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

router.get("/public", getPublicCafes);

// OWNER ROUTES
router.post("/", authMiddleware, authorize("owner"), createCafe);
router.get("/my", authMiddleware, authorize("owner"), getMyCafe);
router.put("/my", authMiddleware, authorize("owner"), updateCafe);

// ADMIN ROUTES
router.get("/", authMiddleware, authorize("admin"), getAllCafes);
router.put("/:id/status", authMiddleware, authorize("admin"), updateCafeStatus);

module.exports = router;
