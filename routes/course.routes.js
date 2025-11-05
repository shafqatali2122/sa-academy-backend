// backend/routes/course.routes.js

const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseBySlug,
  getCourseById, // <-- WE CAN NOW IMPORT THIS
  updateCourse,
  deleteCourse,
} = require('../controllers/course.controller');

// 1. Import BOTH middleware functions
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// 2. Define the roles that can manage content
const contentManagerRoles = ['ContentAdmin', 'SuperAdmin'];

// =========================
// ROUTES
// =========================

// CREATE (Protected) + READ ALL (Public)
router
  .route('/')
  .post(protect, authorizeRoles(...contentManagerRoles), createCourse)
  .get(getCourses);

// PUBLIC: GET BY SLUG (used for frontend display)
router.get('/slug/:slug', getCourseBySlug);

// ALL ROUTES BELOW ARE FOR A SPECIFIC ID
router
  .route('/:id')
  // GET BY ID (for admin "edit" page)
  .get(protect, authorizeRoles(...contentManagerRoles), getCourseById)
  // UPDATE (Protected)
  .put(protect, authorizeRoles(...contentManagerRoles), updateCourse)
  // DELETE (Protected - only SuperAdmin)
  .delete(protect, authorizeRoles('SuperAdmin'), deleteCourse);

module.exports = router;