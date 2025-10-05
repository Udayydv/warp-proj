const express = require('express');
const { authenticate, authorize, requireApprovedCreator, optionalAuth } = require('../middleware/auth');
const uploads = require('../middleware/upload');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const router = express.Router();

// @route   GET /api/courses
// @desc    Get all published courses (for learners) or creator's courses (for creators)
// @access  Public for published courses, Private for creator's courses
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      level,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};
    let sort = {};

    // If user is authenticated and is a creator, show their courses
    if (req.user && req.user.role === 'creator') {
      filter.creator = req.user._id;
    } else {
      // For public access, only show published courses
      filter.isPublished = true;
    }

    // Apply filters
    if (category) filter.category = new RegExp(category, 'i');
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Apply sorting
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await Course.find(filter)
      .populate('creator', 'name avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Course.countDocuments(filter);

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public for published courses, Private for course creators
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('creator', 'name avatar creatorApplication.bio')
      .populate('lessons');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const isCreator = req.user && req.user._id.toString() === course.creator._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!course.isPublished && !isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Course is not published' });
    }

    // Get enrollment info if user is authenticated
    let enrollment = null;
    if (req.user && req.user.role === 'learner') {
      enrollment = await Enrollment.findOne({
        user: req.user._id,
        course: course._id
      }).populate('completedLessons.lesson');
    }

    res.json({ course, enrollment });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error fetching course' });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (approved creators only)
router.post('/', authenticate, authorize('creator'), requireApprovedCreator, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      price = 0,
      level = 'beginner'
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        message: 'Please provide title, description, and category'
      });
    }

    const course = new Course({
      title,
      description,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      price,
      level,
      creator: req.user._id
    });

    await course.save();
    await course.populate('creator', 'name avatar');

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (course creator only)
router.put('/:id', authenticate, authorize('creator'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user owns the course
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    const {
      title,
      description,
      category,
      tags,
      price,
      level,
      thumbnail
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());
    if (price !== undefined) updateData.price = price;
    if (level) updateData.level = level;
    if (thumbnail) updateData.thumbnail = thumbnail;

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('creator', 'name avatar');

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (course creator only)
router.delete('/:id', authenticate, authorize('creator'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user owns the course
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // Check if course has enrollments
    const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
    if (enrollmentCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete course with active enrollments'
      });
    }

    // Delete associated lessons
    await Lesson.deleteMany({ course: course._id });

    // Delete the course
    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
});

// @route   POST /api/courses/:id/submit-review
// @desc    Submit course for admin review
// @access  Private (course creator only)
router.post('/:id/submit-review', authenticate, authorize('creator'), requireApprovedCreator, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit this course for review' });
    }

    // Check if course has at least one lesson
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    if (lessonCount === 0) {
      return res.status(400).json({
        message: 'Course must have at least one lesson before submitting for review'
      });
    }

    // Update course status
    course.status = 'pending_review';
    await course.save();

    res.json({
      message: 'Course submitted for review successfully',
      course
    });
  } catch (error) {
    console.error('Submit course review error:', error);
    res.status(500).json({ message: 'Server error submitting course for review' });
  }
});

// @route   POST /api/courses/:id/upload-thumbnail
// @desc    Upload course thumbnail
// @access  Private (course creator only)
router.post('/:id/upload-thumbnail', authenticate, authorize('creator'), (req, res) => {
  uploads.courseThumbnail(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to upload thumbnail for this course' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Update course with thumbnail path
      const thumbnailPath = `/uploads/course-thumbnails/${req.file.filename}`;
      course.thumbnail = thumbnailPath;
      await course.save();

      res.json({
        message: 'Thumbnail uploaded successfully',
        thumbnail: thumbnailPath
      });
    } catch (error) {
      console.error('Upload thumbnail error:', error);
      res.status(500).json({ message: 'Server error uploading thumbnail' });
    }
  });
});

module.exports = router;