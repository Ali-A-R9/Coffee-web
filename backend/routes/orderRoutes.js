const express = require("express");
const router = express.Router();

const {
  createOrder,
  getClientOrders,
  getOwnerOrders,
  updateOwnerOrderStatus,
} = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, authorize("client"), createOrder);
router.get("/my", authMiddleware, authorize("client"), getClientOrders);
router.get("/owner", authMiddleware, authorize("owner"), getOwnerOrders);
router.put("/:id/status", authMiddleware, authorize("owner"), updateOwnerOrderStatus);

module.exports = router;
