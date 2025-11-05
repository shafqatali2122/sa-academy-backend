// backend/controllers/user.controller.js

const asyncHandler = require('express-async-handler'); // Handles async errors
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');

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

  // Because our model has a 'default' role, new users will be 'User'
  const user = await User.create({ username, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role, // Send the role back
      token: generateToken(user._id, user.role), // Send role in token
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
      role: user.role, // Send the role back
      token: generateToken(user._id, user.role), // Send role in token
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// ✅ IMPORT MODELS for dashboard stats
const Course = require('../models/course.model');
const Blog = require('../models/blog.model');
const Enrollment = require('../models/enrollment.model');

// @desc    Get dashboard statistics (counts)
// @route   GET /api/users/dashboard-stats
// @access  Private (Admin Only)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalCourses,
    publishedBlogCount,
    draftBlogCount, // NEW: unpublished blogs
    pendingEnrollmentCount,
    processedEnrollmentCount, // NEW: processed enrollments
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
    processedEnrollments: processedEnrollmentCount,
  });
});

// =======================================================
// === 🚀 NEW ADMIN FUNCTIONS ADDED BELOW ===
// =======================================================

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/SuperAdmin
const getUsers = asyncHandler(async (req, res) => {
  // We find all users and send back only the fields we need
  const users = await User.find({}).select('-password');
  res.status(200).json(users);
});

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // We don't want admins deleting other SuperAdmins (including themselves)
  if (user.role === 'SuperAdmin') {
    res.status(400);
    throw new Error('Cannot delete a SuperAdmin');
  }

  await User.deleteOne({ _id: user._id });

  res.status(200).json({ id: req.params.id, message: 'User deleted successfully' });
});

// @desc    Update a user's role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/SuperAdmin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  // Check if the role is valid (using the roles from user.model.js)
  const validRoles = [
    'User',
    'SuperAdmin',
    'AdmissionsAdmin',
    'ContentAdmin',
    'AudienceAdmin',
  ];
  if (!validRoles.includes(role)) {
    // THIS IS THE LINE I FIXED
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

  // Send back the updated user, but without the password
  const updatedUser = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  res.status(200).json(updatedUser);
});

// ✅ Export all controllers (NOW INCLUDES NEW FUNCTIONS)
module.exports = {
  // Existing functions
  registerUser,
  authUser,
  getDashboardStats,

  // NEW Admin functions
  getUsers,
  deleteUser,
  updateUserRole,
};