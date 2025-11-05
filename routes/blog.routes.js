// backend/routes/blog.routes.js

const express = require('express');
const router = express.Router();
const {
  createBlogPost,
  getBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  updateBlogPost,
  deleteBlogPost,
} = require('../controllers/blog.controller');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Define the roles that can manage content
const contentManagerRoles = ['ContentAdmin', 'SuperAdmin'];

// --- Public Routes ---
// Anyone can view all blog posts or read one by its slug
router.route('/').get(getBlogPosts);
router.route('/slug/:slug').get(getBlogPostBySlug);

// --- Protected Routes ---

// Create a new blog post
// (This was already on router.route('/') but we are just adding the POST)
router
  .route('/')
  .post(protect, authorizeRoles(...contentManagerRoles), createBlogPost);

// Routes for a specific blog by its ID
router
  .route('/:id')
  // GET by ID (for admin "edit" page)
  .get(protect, authorizeRoles(...contentManagerRoles), getBlogPostById)
  // Update the blog post
  .put(protect, authorizeRoles(...contentManagerRoles), updateBlogPost)
  // Delete the blog post (Only SuperAdmin can delete)
  .delete(protect, authorizeRoles('SuperAdmin'), deleteBlogPost);

module.exports = router;