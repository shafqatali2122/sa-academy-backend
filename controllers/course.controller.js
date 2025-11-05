// backend/controllers/course.controller.js

const asyncHandler = require('express-async-handler');
const Course = require('../models/course.model');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Admin Only)
const createCourse = asyncHandler(async (req, res) => {
  const { title, slug, description, fullContent, price, image, isPublished } =
    req.body;

  const course = new Course({
    title,
    slug,
    description,
    fullContent,
    price,
    image,
    isPublished,
    user: req.user._id, // Set the creator (from authMiddleware req.user)
  });

  const createdCourse = await course.save();
  res.status(201).json(createdCourse);
});

// @desc    Get all courses (Public access for the /courses page)
// @route   GET /api/courses
// @access  Public
const getCourses = asyncHandler(async (req, res) => {
  // For the public site, only show published courses.
  // For admin, we might show all, but for now, let's keep it simple: show all
  const courses = await Course.find({});
  res.json(courses);
});

// @desc    Get single course by slug (For public course detail page)
// @route   GET /api/courses/:slug
// @access  Public
const getCourseBySlug = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug });

  if (course) {
    res.json(course);
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// =======================================================
// === 🚀 NEW FUNCTION ADDED BELOW ===
// =======================================================

// @desc    Get single course by ID (For admin "edit" page)
// @route   GET /api/courses/:id
// @access  Private (Admin Only)
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (course) {
    res.json(course);
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (Admin Only)
const updateCourse = asyncHandler(async (req, res) => {
  const { title, slug, description, fullContent, price, image, isPublished } =
    req.body;

  const course = await Course.findById(req.params.id);

  if (course) {
    // Update all fields
    course.title = title || course.title;
    course.slug = slug || course.slug;
    course.description = description || course.description;
    course.fullContent = fullContent || course.fullContent;
    course.price = price ?? course.price; // Use ?? for number updates
    course.image = image || course.image;
    course.isPublished = isPublished ?? course.isPublished;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Admin Only)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (course) {
    await course.deleteOne();
    res.json({ message: 'Course removed' });
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// ✅ Export all controllers (NOW INCLUDES NEW FUNCTION)
module.exports = {
  createCourse,
  getCourses,
  getCourseBySlug,
  getCourseById, // <-- NEWLY ADDED
  updateCourse,
  deleteCourse,
};