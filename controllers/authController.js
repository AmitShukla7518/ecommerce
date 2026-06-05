const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || "change-this-secret", { expiresIn: "7d" });

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  token: signToken(user._id),
});

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "User already exists" });

  const user = await User.create({ name, email, password });
  res.status(201).json(userPayload(user));
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json(userPayload(user));
};

exports.me = async (req, res) => {
  res.json(req.user);
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.json({ message: "User Not Found !!" });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your MERN MART password",
      text: `Reset your password by opening this link: ${resetUrl}. This link expires in 15 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#151515">
          <h2>Reset your password</h2>
          <p>Hello ${user.name},</p>
          <p>Use the button below to change your MERN MART password. This link expires in 15 minutes.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#151515;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Reset password</a></p>
          <p>If the button does not work, copy this link into your browser:</p>
          <p>${resetUrl}</p>
        </div>
      `,
    });

    res.json({ message: "Password reset link has been sent on Email." });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    next(error);
  }
};

exports.resetPassword = async (req, res) => {
  if (!req.body.password || req.body.password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Reset token is invalid or expired" });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json(userPayload(user));
};
