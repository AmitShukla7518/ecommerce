const express = require("express");
const { createProduct, getProduct, listProducts } = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", listProducts);
router.get("/:slug", getProduct);
router.post("/", protect, createProduct);

module.exports = router;
