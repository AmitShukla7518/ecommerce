const express = require("express");
const { createPaymentOrder, verifyPayment } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/razorpay/order", createPaymentOrder);
router.post("/razorpay/verify", verifyPayment);

module.exports = router;
