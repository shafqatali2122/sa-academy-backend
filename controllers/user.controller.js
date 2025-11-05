// backend/controllers/user.controller.js

const asyncHandler = require('express-async-handler');
const crypto = require('crypto'); // ✅ Added for password hashing
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/email'); // ✅ Added email utility

// =======================================================
// === USER REGISTRATION & LOGIN ===
// =======================================================

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({ username, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// @desc    Authenticate user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// =======================================================
// === DASHBOARD STATS ===
// =======================================================

const Course = require('../models/course.model');
const Blog = require('../models/blog.model');
const Enrollment = require('../models/enrollment.model');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalCourses,
    publishedBlogCount,
    draftBlogCount,
    pendingEnrollmentCount,
    processedEnrollmentCount,
    pendingCounsellingCount,
  ] = await Promise.all([
    Course.countDocuments({}),
    Blog.countDocuments({ isPublished: true }),
    Blog.countDocuments({ isPublished: false }),
    Enrollment.countDocuments({
      courseOfInterest: { $regex: /^Counselling Request/ },
      isProcessed: false,
    }),
    Enrollment.countDocuments({ isProcessed: false }),
    Enrollment.countDocuments({ isProcessed: true }),
  ]);

  res.json({
    totalCourses,
    publishedBlogs: publishedBlogCount,
    draftBlogs: draftBlogCount,
    pendingCounselling: draftBlogCount,
    pendingEnrollments: pendingEnrollmentCount,
    processedEnrollments: processedEnrollmentCount,
  });
});

// =======================================================
// === ADMIN MANAGEMENT ===
// =======================================================

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.status(200).json(users);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'SuperAdmin') {
    res.status(400);
    throw new Error('Cannot delete a SuperAdmin');
  }

  await User.deleteOne({ _id: user._id });
  res.status(200).json({ id: req.params.id, message: 'User deleted successfully' });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const validRoles = [
    'User',
    'SuperAdmin',
    'AdmissionsAdmin',
    'ContentAdmin',
    'AudienceAdmin',
  ];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
});

// =======================================================
// === PASSWORD RESET SYSTEM ===
// =======================================================

// @desc    Forgot Password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(200)
        .json({ message: 'If a user with that email exists, a reset link has been sent.' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.BASE_URL}/reset-password/${resetToken}`;
    const message = `
      You requested a password reset.
      Please click the following link (valid for 10 minutes):
      \n\n ${resetURL} \n\n
      If you did not request this, please ignore this email.
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Link (Valid for 10 min)',
      text: message,
    });

    res.status(200).json({
      message: 'If a user with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    if (user) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
    res.status(500).json({ message: 'Error sending reset email. Please try again.' });
  }
});

// @desc    Reset Password
// @route   POST /api/users/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const resetToken = req.params.token;
  const { password, confirmPassword } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. Please log in.' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    res.status(500).json({ message: 'Error resetting password.' });
  }
});

// =======================================================
// === EXPORT ALL CONTROLLERS ===
// =======================================================
module.exports = {
  // Existing
  registerUser,
  authUser,
  getDashboardStats,
  getUsers,
  deleteUser,
  updateUserRole,

  // New Password Reset
  forgotPassword,
  resetPassword,
};
