const express = require("express");
const { createOrder, getMyOrders, getOrder } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/", createOrder);
router.get("/mine", getMyOrders);
router.get("/:id", getOrder);

module.exports = router;
