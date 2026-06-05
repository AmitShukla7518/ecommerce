const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    size: String,
    color: String,
    stock: { type: Number, default: 0 },
    price: Number,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: String,
    category: String,
    description: String,
    price: { type: Number, required: true },
    discountPrice: Number,
    images: [String],
    rating: { type: Number, default: 4.5 },
    numReviews: { type: Number, default: 0 },
    variants: [variantSchema],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
