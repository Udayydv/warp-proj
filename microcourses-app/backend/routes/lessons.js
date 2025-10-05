const express = require('express');
const { authenticate, authorize, requireApprovedCreator } = require('../middleware/auth');
const uploads = require('../middleware/upload');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const router = express.Router();

// @route   GET /api/lessons/course/:courseId
// @desc    Get all lessons for a course
// @access  Public for published courses, Private for course creators
router.get('/course/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lessons = await Lesson.find({ course: req.params.courseId })
      .sort({ order: 1 });

    res.json({ lessons });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ message: 'Server error fetching lessons' });
  }
});

// @route   GET /api/lessons/:id
// @desc    Get single lesson by ID
// @access  Public for published lessons, Private for course creators
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'title creator isPublished');

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if lesson belongs to published course
    if (!lesson.course.isPublished) {
      return res.status(403).json({ message: 'Lesson is not available' });
    }

    res.json({ lesson });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ message: 'Server error fetching lesson' });
  }
});

// @route   POST /api/lessons
// @desc    Create a new lesson
// @access  Private (approved creators only)
router.post('/', authenticate, authorize('creator'), requireApprovedCreator, async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      order,
      videoUrl,
      videoDuration,
      materials
    } = req.body;

    if (!title || !description || !course || !order || !videoUrl) {
      return res.status(400).json({
        message: 'Please provide title, description, course, order, and video URL'
      });
    }

    // Verify course exists and user owns it
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (courseDoc.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add lessons to this course' });
    }

    // Check if order already exists for this course
    const existingLesson = await Lesson.findOne({ course, order });
    if (existingLesson) {
      return res.status(400).json({
        message: `Lesson with order ${order} already exists for this course`
      });
    }

    const lesson = new Lesson({
      title,
      description,
      course,
      order,
      videoUrl,
      videoDuration: videoDuration || 0,
      materials: materials || []
    });

    await lesson.save();

    // Generate transcript automatically
    await lesson.generateTranscript();

    res.status(201).json({
      message: 'Lesson created successfully',
      lesson
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Lesson order must be unique within the course'
      });
    }
    res.status(500).json({ message: 'Server error creating lesson' });
  }
});

// @route   PUT /api/lessons/:id
// @desc    Update lesson
// @access  Private (course creator only)
router.put('/:id', authenticate, authorize('creator'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if user owns the course
    if (lesson.course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this lesson' });
    }

    const {
      title,
      description,
      order,
      videoUrl,
      videoDuration,
      materials
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (order && order !== lesson.order) {
      // Check if new order is available
      const existingLesson = await Lesson.findOne({ 
        course: lesson.course._id, 
        order,
        _id: { $ne: lesson._id }
      });
      if (existingLesson) {
        return res.status(400).json({
          message: `Lesson with order ${order} already exists for this course`
        });
      }
      updateData.order = order;
    }
    if (videoUrl) {
      updateData.videoUrl = videoUrl;
      // Reset transcript if video URL changes
      updateData.transcript = '';
      updateData.isTranscriptGenerated = false;
    }
    if (videoDuration !== undefined) updateData.videoDuration = videoDuration;
    if (materials) updateData.materials = materials;

    const updatedLesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Regenerate transcript if video URL changed
    if (videoUrl && videoUrl !== lesson.videoUrl) {
      await updatedLesson.generateTranscript();
    }

    res.json({
      message: 'Lesson updated successfully',
      lesson: updatedLesson
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Lesson order must be unique within the course'
      });
    }
    res.status(500).json({ message: 'Server error updating lesson' });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete lesson
// @access  Private (course creator only)
router.delete('/:id', authenticate, authorize('creator'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if user owns the course
    if (lesson.course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this lesson' });
    }

    await Lesson.findByIdAndDelete(req.params.id);

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ message: 'Server error deleting lesson' });
  }
});

// @route   POST /api/lessons/:id/publish
// @desc    Publish/unpublish lesson
// @access  Private (course creator only)
router.post('/:id/publish', authenticate, authorize('creator'), async (req, res) => {
  try {
    const { isPublished } = req.body;
    
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if user owns the course
    if (lesson.course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to publish/unpublish this lesson' });
    }

    lesson.isPublished = isPublished;
    await lesson.save();

    res.json({
      message: `Lesson ${isPublished ? 'published' : 'unpublished'} successfully`,
      lesson
    });
  } catch (error) {
    console.error('Publish lesson error:', error);
    res.status(500).json({ message: 'Server error publishing lesson' });
  }
});

// @route   POST /api/lessons/:id/generate-transcript
// @desc    Manually trigger transcript generation
// @access  Private (course creator only)
router.post('/:id/generate-transcript', authenticate, authorize('creator'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if user owns the course
    if (lesson.course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to generate transcript for this lesson' });
    }

    const transcript = await lesson.generateTranscript();

    res.json({
      message: 'Transcript generated successfully',
      transcript
    });
  } catch (error) {
    console.error('Generate transcript error:', error);
    res.status(500).json({ message: 'Server error generating transcript' });
  }
});

// @route   POST /api/lessons/:id/upload-video
// @desc    Upload lesson video
// @access  Private (course creator only)
router.post('/:id/upload-video', authenticate, authorize('creator'), (req, res) => {
  uploads.lessonVideo(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const lesson = await Lesson.findById(req.params.id).populate('course');

      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      if (lesson.course.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to upload video for this lesson' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded' });
      }

      // Update lesson with video path
      const videoPath = `/uploads/lesson-videos/${req.file.filename}`;
      lesson.videoUrl = videoPath;
      lesson.transcript = ''; // Reset transcript
      lesson.isTranscriptGenerated = false;
      await lesson.save();

      // Generate transcript for new video
      await lesson.generateTranscript();

      res.json({
        message: 'Video uploaded successfully',
        videoUrl: videoPath
      });
    } catch (error) {
      console.error('Upload video error:', error);
      res.status(500).json({ message: 'Server error uploading video' });
    }
  });
});

module.exports = router;