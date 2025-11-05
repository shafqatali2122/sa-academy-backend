// backend/routes/material.routes.js

const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  toggleCategory,
  createMaterial,
  getMaterials,
  deleteMaterial,
  incrementDownload,
} = require('../controllers/material.controller');

// 1. Import BOTH middleware functions
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

// Configuration for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sa-academy/materials',
    resource_type: 'raw',
    public_id: (req, file) => `${Date.now()}_${file.originalname}`,
  },
});
const upload = multer({ storage });

// 2. Define the roles that can manage content
const contentManagerRoles = ['ContentAdmin', 'SuperAdmin'];

// --- Categories CRUD ---
router
  .route('/categories')
  .post(protect, authorizeRoles(...contentManagerRoles), createCategory) // PRIVATE
  .get(getCategories); // PUBLIC

router
  .route('/categories/:id/toggle')
  .put(protect, authorizeRoles(...contentManagerRoles), toggleCategory); // PRIVATE

// --- Materials CRUD ---
router
  .route('/')
  .post(
    protect,
    authorizeRoles(...contentManagerRoles), // Added security
    upload.single('file'), // Runs after auth
    createMaterial
  ) // PRIVATE
  .get(getMaterials); // PUBLIC

router
  .route('/:id')
  .delete(protect, authorizeRoles('SuperAdmin'), deleteMaterial); // PRIVATE

// --- Login-gated download ---
// We leave this with just 'protect' so any logged-in user can download
router.route('/:id/download').post(protect, incrementDownload); // LOGIN-GATED

module.exports = router;