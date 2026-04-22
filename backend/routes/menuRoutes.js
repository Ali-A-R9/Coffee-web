const express = require("express");
const router = express.Router();

const { getMenu, saveMenu } = require("../controllers/menuController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

router.get("/", authMiddleware, authorize("owner"), getMenu);
router.post("/", authMiddleware, authorize("owner"), saveMenu);

module.exports = router;
