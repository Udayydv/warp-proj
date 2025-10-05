const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const router = express.Router();

// @route   GET /api/admin/creator-applications
// @desc    Get pending creator applications
// @access  Private (admin only)
router.get('/creator-applications', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    const applications = await User.find({
      role: 'creator',
      'creatorApplication.status': status
    }).select('-password').sort({ 'creatorApplication.appliedAt': -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Get creator applications error:', error);
    res.status(500).json({ message: 'Server error fetching creator applications' });
  }
});

// @route   PUT /api/admin/creator-applications/:userId/approve
// @desc    Approve or reject creator application
// @access  Private (admin only)
router.put('/creator-applications/:userId/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { action, reason = '' } = req.body; // action: 'approve' or 'reject'
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject' });
    }

    const user = await User.findById(req.params.userId);
    if (!user || user.role !== 'creator') {
      return res.status(404).json({ message: 'Creator application not found' });
    }

    if (user.creatorApplication.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Application has already been processed' 
      });
    }

    // Update application status
    user.creatorApplication.status = action === 'approve' ? 'approved' : 'rejected';
    user.isApproved = action === 'approve';
    
    if (action === 'reject' && reason) {
      user.creatorApplication.rejectionReason = reason;
    }

    await user.save();

    res.json({
      message: `Creator application ${action}d successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved,
        creatorApplication: user.creatorApplication
      }
    });
  } catch (error) {
    console.error('Approve creator application error:', error);
    res.status(500).json({ message: 'Server error processing creator application' });
  }
});

// @route   GET /api/admin/course-reviews
// @desc    Get courses pending review
// @access  Private (admin only)
router.get('/course-reviews', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status = 'pending_review' } = req.query;
    
    const courses = await Course.find({ status })
      .populate('creator', 'name email creatorApplication.expertise')
      .populate('lessons')
      .sort({ updatedAt: -1 });

    res.json({ courses });
  } catch (error) {
    console.error('Get course reviews error:', error);
    res.status(500).json({ message: 'Server error fetching course reviews' });
  }
});

// @route   PUT /api/admin/course-reviews/:courseId/approve
// @desc    Approve or reject course for publication
// @access  Private (admin only)
router.put('/course-reviews/:courseId/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { action, reason = '' } = req.body; // action: 'approve' or 'reject'
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject' });
    }

    const course = await Course.findById(req.params.courseId).populate('creator', 'name email');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status !== 'pending_review') {
      return res.status(400).json({ 
        message: 'Course is not pending review' 
      });
    }

    if (action === 'approve') {
      course.status = 'published';
      course.isPublished = true;
    } else {
      course.status = 'rejected';
      course.isPublished = false;
      course.rejectionReason = reason;
    }

    await course.save();

    res.json({
      message: `Course ${action}d successfully`,
      course: {
        _id: course._id,
        title: course.title,
        status: course.status,
        isPublished: course.isPublished,
        rejectionReason: course.rejectionReason
      }
    });
  } catch (error) {
    console.error('Approve course error:', error);
    res.status(500).json({ message: 'Server error processing course review' });
  }
});

// @route   GET /api/admin/dashboard-stats
// @desc    Get admin dashboard statistics
// @access  Private (admin only)
router.get('/dashboard-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Get current date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const learners = await User.countDocuments({ role: 'learner' });
    const creators = await User.countDocuments({ role: 'creator' });
    const approvedCreators = await User.countDocuments({ 
      role: 'creator', 
      isApproved: true 
    });
    const pendingCreatorApplications = await User.countDocuments({
      role: 'creator',
      'creatorApplication.status': 'pending'
    });

    // Course statistics
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const pendingCourseReviews = await Course.countDocuments({ status: 'pending_review' });
    const draftCourses = await Course.countDocuments({ status: 'draft' });

    // Enrollment statistics
    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ isCompleted: true });
    const recentEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: sevenDaysAgo }
    });

    // Certificate statistics
    const totalCertificates = await Certificate.countDocuments();
    const recentCertificates = await Certificate.countDocuments({
      issuedAt: { $gte: thirtyDaysAgo }
    });

    // Activity trends (enrollments per day for the last 30 days)
    const enrollmentTrends = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$enrolledAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top performing courses
    const topCourses = await Course.aggregate([
      { $match: { isPublished: true } },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: '$creator' },
      {
        $project: {
          title: 1,
          enrollmentCount: 1,
          'rating.average': 1,
          'rating.count': 1,
          'creator.name': 1
        }
      }
    ]);

    const stats = {
      users: {
        total: totalUsers,
        learners,
        creators,
        approvedCreators,
        pendingCreatorApplications
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        pendingReview: pendingCourseReviews,
        draft: draftCourses
      },
      enrollments: {
        total: totalEnrollments,
        completed: completedEnrollments,
        recent: recentEnrollments,
        completionRate: totalEnrollments > 0 ? 
          Math.round((completedEnrollments / totalEnrollments) * 100) : 0
      },
      certificates: {
        total: totalCertificates,
        recent: recentCertificates
      },
      trends: {
        enrollments: enrollmentTrends
      },
      topCourses
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard statistics' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (admin only)
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      status // for creator status
    } = req.query;

    let filter = {};
    
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (status && role === 'creator') {
      if (status === 'approved') filter.isApproved = true;
      else if (status === 'pending') filter.isApproved = false;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   PUT /api/admin/users/:userId/status
// @desc    Update user status (suspend, activate, etc.)
// @access  Private (admin only)
router.put('/users/:userId/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'active', 'suspended', etc.
    
    // Prevent admin from modifying other admins
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot modify admin users' });
    }

    const updateData = { status };
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'User status updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// @route   GET /api/admin/reports/activity
// @desc    Generate activity report
// @access  Private (admin only)
router.get('/reports/activity', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());

    // User registrations
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Course publications
    const coursePublications = await Course.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'published'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Enrollments
    const enrollments = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      report: {
        period: { start, end },
        userRegistrations,
        coursePublications,
        enrollments
      }
    });
  } catch (error) {
    console.error('Generate activity report error:', error);
    res.status(500).json({ message: 'Server error generating activity report' });
  }
});

module.exports = router;