const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

exports.createPaymentOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const razorpay = getRazorpay();
  if (!razorpay) {
    return res.json({
      demo: true,
      key: "rzp_test_demo",
      orderId: `demo_${order._id}`,
      amount: order.total * 100,
      currency: "INR",
    });
  }

  const paymentOrder = await razorpay.orders.create({
    amount: order.total * 100,
    currency: "INR",
    receipt: order._id.toString(),
  });

  res.json({
    key: process.env.RAZORPAY_KEY_ID,
    orderId: paymentOrder.id,
    amount: paymentOrder.amount,
    currency: paymentOrder.currency,
  });
};

exports.verifyPayment = async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, demo } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (!demo) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.status = "Paid";
  order.paymentResult = {
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  };
  await order.save();

  res.json(order);
};
