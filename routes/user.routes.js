// backend/routes/user.routes.js

const express = require('express');
const router = express.Router();
const User = require('../models/user.model'); // This is fine to keep

// 1. Import BOTH middleware functions
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// 2. Import ALL your user controller functions
const {
  registerUser,
  authUser,
  getDashboardStats,
  getUsers, // <-- NEW
  deleteUser, // <-- NEW
  updateUserRole, // <-- NEW
} = require('../controllers/user.controller');

// -------------------------------------------
// PUBLIC ROUTES (No 'protect')
// -------------------------------------------
router.post('/', registerUser);
router.post('/login', authUser);

// -------------------------------------------
// PROTECTED ROUTES (Require Auth)
// -------------------------------------------

// We use authorizeRoles to allow ALL admin types to see the stats
router.get(
  '/dashboard-stats',
  protect,
  authorizeRoles(
    'SuperAdmin',
    'AdmissionsAdmin',
    'ContentAdmin',
    'AudienceAdmin'
  ),
  getDashboardStats
);

// -------------------------------------------
// SUPER ADMIN-ONLY ROUTES
// -------------------------------------------

// GET all users (SuperAdmin only)
// We replaced your old logic with authorizeRoles('SuperAdmin')
// and the 'getUsers' controller
router.get('/', protect, authorizeRoles('SuperAdmin'), getUsers);

// PUT: Update user role (SuperAdmin only)
// Note: We use 'PUT' to match the controller we wrote
// We replaced your old logic with authorizeRoles('SuperAdmin')
// and the 'updateUserRole' controller
router.put('/:id/role', protect, authorizeRoles('SuperAdmin'), updateUserRole);

// DELETE a user (SuperAdmin only)
// We replaced your old logic with authorizeRoles('SuperAdmin')
// and the 'deleteUser' controller
router.delete('/:id', protect, authorizeRoles('SuperAdmin'), deleteUser);

module.exports = router;