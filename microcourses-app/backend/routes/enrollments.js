const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/enrollments/enroll/:courseId
// @desc    Enroll in a course
// @access  Private (learners only)
router.post('/enroll/:courseId', authenticate, authorize('learner'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate('creator', 'name');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPublished) {
      return res.status(400).json({ message: 'Course is not published' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user._id,
      course: course._id
    });

    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(course._id, {
      $inc: { enrollmentCount: 1 }
    });

    await enrollment.populate('course', 'title thumbnail');

    res.status(201).json({
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error during enrollment' });
  }
});

// @route   GET /api/enrollments/my-enrollments
// @desc    Get current user's enrollments
// @access  Private (learners only)
router.get('/my-enrollments', authenticate, authorize('learner'), async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    let filter = { user: req.user._id };
    
    if (status === 'completed') {
      filter.isCompleted = true;
    } else if (status === 'in-progress') {
      filter.isCompleted = false;
    }

    const enrollments = await Enrollment.find(filter)
      .populate('course', 'title description thumbnail creator category level duration')
      .populate('course.creator', 'name avatar')
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: 'Server error fetching enrollments' });
  }
});

// @route   GET /api/enrollments/:courseId/progress
// @desc    Get enrollment progress for a course
// @access  Private (learners only)
router.get('/:courseId/progress', authenticate, authorize('learner'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    })
      .populate('completedLessons.lesson', 'title order')
      .populate('course', 'title');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Get all lessons for the course
    const lessons = await Lesson.find({ 
      course: req.params.courseId, 
      isPublished: true 
    }).sort({ order: 1 });

    res.json({
      enrollment,
      totalLessons: lessons.length,
      completedLessons: enrollment.completedLessons.length,
      progress: enrollment.progress,
      nextLesson: lessons.find(lesson => 
        !enrollment.completedLessons.some(cl => 
          cl.lesson._id.toString() === lesson._id.toString()
        )
      )
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error fetching progress' });
  }
});

// @route   POST /api/enrollments/:courseId/complete-lesson/:lessonId
// @desc    Mark a lesson as completed
// @access  Private (learners only)
router.post('/:courseId/complete-lesson/:lessonId', authenticate, authorize('learner'), async (req, res) => {
  try {
    const { watchTime = 0 } = req.body;
    
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Verify lesson exists and belongs to course
    const lesson = await Lesson.findOne({
      _id: req.params.lessonId,
      course: req.params.courseId,
      isPublished: true
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await enrollment.completeLesson(req.params.lessonId, watchTime);
    
    // Update last accessed time
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    // Check if course is completed and issue certificate
    let certificate = null;
    if (enrollment.isCompleted && !enrollment.certificateIssued) {
      const course = await Course.findById(req.params.courseId).populate('creator', 'name');
      const user = await User.findById(req.user._id);
      
      const completionTime = Math.ceil((new Date() - enrollment.enrolledAt) / (1000 * 60 * 60 * 24));
      
      certificate = new Certificate({
        user: req.user._id,
        course: req.params.courseId,
        enrollment: enrollment._id,
        completionDate: enrollment.completedAt,
        metadata: {
          courseTitle: course.title,
          courseDuration: course.duration,
          completionTime,
          userName: user.name,
          creatorName: course.creator.name
        }
      });
      
      await certificate.save();
      
      enrollment.certificateIssued = true;
      enrollment.certificateIssuedAt = new Date();
      await enrollment.save();
    }

    res.json({
      message: 'Lesson completed successfully',
      progress: enrollment.progress,
      isCompleted: enrollment.isCompleted,
      certificate: certificate ? {
        serialNumber: certificate.serialNumber,
        issuedAt: certificate.issuedAt
      } : null
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ message: 'Server error completing lesson' });
  }
});

// @route   POST /api/enrollments/:courseId/rate
// @desc    Rate and review a course
// @access  Private (learners only)
router.post('/:courseId/rate', authenticate, authorize('learner'), async (req, res) => {
  try {
    const { score, review } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be between 1 and 5' });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Update enrollment with rating
    enrollment.rating = {
      score,
      review: review || '',
      ratedAt: new Date()
    };

    await enrollment.save();

    // Update course rating
    const course = await Course.findById(req.params.courseId);
    const allRatings = await Enrollment.find({
      course: req.params.courseId,
      'rating.score': { $exists: true }
    });

    const totalRatings = allRatings.length;
    const averageRating = allRatings.reduce((sum, enrollment) => 
      sum + enrollment.rating.score, 0) / totalRatings;

    course.rating = {
      average: Math.round(averageRating * 10) / 10,
      count: totalRatings
    };

    await course.save();

    res.json({
      message: 'Course rated successfully',
      rating: enrollment.rating,
      courseRating: course.rating
    });
  } catch (error) {
    console.error('Rate course error:', error);
    res.status(500).json({ message: 'Server error rating course' });
  }
});

// @route   DELETE /api/enrollments/:courseId
// @desc    Unenroll from a course
// @access  Private (learners only)
router.delete('/:courseId', authenticate, authorize('learner'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Don't allow unenrollment if course is completed
    if (enrollment.isCompleted) {
      return res.status(400).json({
        message: 'Cannot unenroll from a completed course'
      });
    }

    // Delete enrollment
    await Enrollment.findByIdAndDelete(enrollment._id);

    // Update course enrollment count
    await Course.findByIdAndUpdate(req.params.courseId, {
      $inc: { enrollmentCount: -1 }
    });

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ message: 'Server error during unenrollment' });
  }
});

module.exports = router;