const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/users/apply-creator
// @desc    Apply to become a creator
// @access  Private (learners only)
router.post('/apply-creator', authenticate, async (req, res) => {
  try {
    // Check if user is a learner
    if (req.user.role !== 'learner') {
      return res.status(400).json({
        message: 'Only learners can apply to become creators'
      });
    }

    const { bio, expertise, portfolio } = req.body;

    // Validate required fields
    if (!bio || !expertise || !Array.isArray(expertise) || expertise.length === 0) {
      return res.status(400).json({
        message: 'Please provide bio and at least one area of expertise'
      });
    }

    // Update user with creator application
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        role: 'creator',
        isApproved: false,
        creatorApplication: {
          bio,
          expertise,
          portfolio,
          appliedAt: new Date(),
          status: 'pending'
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Creator application submitted successfully',
      user
    });
  } catch (error) {
    console.error('Creator application error:', error);
    res.status(500).json({ message: 'Server error submitting creator application' });
  }
});

// @route   GET /api/users/creator-status
// @desc    Get creator application status
// @access  Private (creators only)
router.get('/creator-status', authenticate, authorize('creator'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('creatorApplication isApproved');
    
    res.json({
      application: user.creatorApplication,
      isApproved: user.isApproved
    });
  } catch (error) {
    console.error('Creator status error:', error);
    res.status(500).json({ message: 'Server error fetching creator status' });
  }
});

// @route   PUT /api/users/update-creator-profile
// @desc    Update creator profile/application
// @access  Private (creators only)
router.put('/update-creator-profile', authenticate, authorize('creator'), async (req, res) => {
  try {
    const { bio, expertise, portfolio } = req.body;
    
    const updateData = {};
    if (bio) updateData['creatorApplication.bio'] = bio;
    if (expertise && Array.isArray(expertise)) updateData['creatorApplication.expertise'] = expertise;
    if (portfolio) updateData['creatorApplication.portfolio'] = portfolio;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Creator profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Creator profile update error:', error);
    res.status(500).json({ message: 'Server error updating creator profile' });
  }
});

// @route   GET /api/users/dashboard-stats
// @desc    Get user dashboard statistics
// @access  Private
router.get('/dashboard-stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    let stats = {};

    if (userRole === 'learner') {
      const Enrollment = require('../models/Enrollment');
      const Certificate = require('../models/Certificate');
      
      // Get learner statistics
      const enrollments = await Enrollment.find({ user: userId });
      const completedCourses = enrollments.filter(e => e.isCompleted);
      const certificates = await Certificate.find({ user: userId });
      
      stats = {
        enrolledCourses: enrollments.length,
        completedCourses: completedCourses.length,
        inProgressCourses: enrollments.length - completedCourses.length,
        certificates: certificates.length,
        totalWatchTime: enrollments.reduce((total, e) => {
          return total + e.completedLessons.reduce((lessonTotal, cl) => 
            lessonTotal + cl.watchTime, 0);
        }, 0)
      };
    } else if (userRole === 'creator') {
      const Course = require('../models/Course');
      const Enrollment = require('../models/Enrollment');
      
      // Get creator statistics
      const courses = await Course.find({ creator: userId });
      const publishedCourses = courses.filter(c => c.isPublished);
      const totalEnrollments = await Enrollment.countDocuments({
        course: { $in: courses.map(c => c._id) }
      });
      
      stats = {
        totalCourses: courses.length,
        publishedCourses: publishedCourses.length,
        draftCourses: courses.filter(c => c.status === 'draft').length,
        pendingReviewCourses: courses.filter(c => c.status === 'pending_review').length,
        totalEnrollments,
        totalRevenue: courses.reduce((total, c) => total + (c.price * c.enrollmentCount), 0)
      };
    } else if (userRole === 'admin') {
      const Course = require('../models/Course');
      const User = require('../models/User');
      
      // Get admin statistics
      const pendingCreators = await User.countDocuments({
        role: 'creator',
        'creatorApplication.status': 'pending'
      });
      const pendingCourses = await Course.countDocuments({ status: 'pending_review' });
      const totalUsers = await User.countDocuments();
      const totalCourses = await Course.countDocuments();
      
      stats = {
        pendingCreatorApplications: pendingCreators,
        pendingCourseReviews: pendingCourses,
        totalUsers,
        totalCourses,
        publishedCourses: await Course.countDocuments({ isPublished: true })
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard statistics' });
  }
});

module.exports = router;