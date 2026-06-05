const Product = require("../models/Product");
const seedProducts = require("../data/seedProducts");

const ensureProducts = async () => {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(seedProducts);
  }
};

exports.listProducts = async (req, res) => {
  await ensureProducts();
  const { search = "", category = "" } = req.query;
  const filter = {};

  if (search) filter.name = { $regex: search, $options: "i" };
  if (category) filter.category = category;

  const products = await Product.find(filter).sort({ featured: -1, createdAt: -1 });
  const categories = await Product.distinct("category");

  res.json({ products, categories });
};

exports.getProduct = async (req, res) => {
  await ensureProducts();
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};
