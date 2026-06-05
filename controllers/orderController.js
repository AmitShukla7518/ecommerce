const Order = require("../models/Order");
const Product = require("../models/Product");

const calculateOrder = async (items) => {
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });

    const variant =
      product.variants.find((entry) => entry.size === item.size && entry.color === item.color) || product.variants[0];
    const price = variant?.price || product.discountPrice || product.price;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0],
      size: item.size || variant?.size,
      color: item.color || variant?.color,
      quantity: Number(item.quantity || 1),
      price,
    });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const shipping = subtotal > 4999 ? 0 : 149;
  const total = subtotal + tax + shipping;

  return { orderItems, subtotal, tax, shipping, total };
};

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod = "Razorpay" } = req.body;
    if (!items?.length) return res.status(400).json({ message: "Order items are required" });

    const totals = await calculateOrder(items);
    const order = await Order.create({
      user: req.user._id,
      items: totals.orderItems,
      shippingAddress,
      paymentMethod,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      total: totals.total,
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

exports.getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};
