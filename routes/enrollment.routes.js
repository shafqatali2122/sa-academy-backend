// backend/routes/enrollment.routes.js

const express = require('express');
const router = express.Router();
const {
  submitEnrollment,
  getEnrollments,
  updateEnrollmentStatus,
  updateEnrollmentStatusExplicit,
  deleteEnrollment,
} = require('../controllers/enrollment.controller');

// 1. Import BOTH middleware functions
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const {
  submitCounsellingRequest,
  getCounsellingRequests,
} = require('../controllers/specialForms.controller');

// -----------------------------
// Enrollment Routes
// -----------------------------

// We define the roles that are allowed to manage enrollments
const allowedRoles = ['AdmissionsAdmin', 'SuperAdmin'];

// Route for submitting the form (POST, public) and reading all (GET, protected)
router
  .route('/')
  .post(submitEnrollment) // PUBLIC ROUTE
  .get(protect, authorizeRoles(...allowedRoles), getEnrollments); // PRIVATE

// Route for specific record deletion (protected)
router
  .route('/:id')
  .delete(protect, authorizeRoles(...allowedRoles), deleteEnrollment); // PRIVATE

// Route for toggling status (legacy)
router
  .route('/:id/process')
  .put(protect, authorizeRoles(...allowedRoles), updateEnrollmentStatus); // PRIVATE

// ✅ NEW: Route for explicit Accept/Reject status
router
  .route('/:id/status')
  .put(protect, authorizeRoles(...allowedRoles), updateEnrollmentStatusExplicit); // PRIVATE

// -----------------------------
// Counselling Routes
// -----------------------------

router
  .route('/counselling')
  .post(submitCounsellingRequest) // PUBLIC Submission
  .get(protect, authorizeRoles(...allowedRoles), getCounsellingRequests); // PRIVATE

// ✅ Always export router at the end
module.exports = router;