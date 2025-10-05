const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const router = express.Router();

// @route   GET /api/certificates/my-certificates
// @desc    Get user's certificates
// @access  Private (learners only)
router.get('/my-certificates', authenticate, authorize('learner'), async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('course', 'title thumbnail category level duration')
      .populate('user', 'name email')
      .sort({ issuedAt: -1 });

    res.json({ certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Server error fetching certificates' });
  }
});

// @route   GET /api/certificates/:id
// @desc    Get certificate by ID
// @access  Private (certificate owner only)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('course', 'title description category level duration creator')
      .populate('user', 'name email avatar')
      .populate('course.creator', 'name')
      .populate('enrollment', 'enrolledAt completedAt progress');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user owns the certificate or is admin
    if (certificate.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this certificate' });
    }

    res.json({ certificate });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ message: 'Server error fetching certificate' });
  }
});

// @route   GET /api/certificates/verify/:serialNumber
// @desc    Verify certificate by serial number
// @access  Public
router.get('/verify/:serialNumber', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    
    const verification = await Certificate.verifyBySerial(serialNumber);
    
    res.json(verification);
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ message: 'Server error verifying certificate' });
  }
});

// @route   POST /api/certificates/:id/download
// @desc    Generate downloadable certificate (placeholder)
// @access  Private (certificate owner only)
router.post('/:id/download', authenticate, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('course', 'title description category')
      .populate('user', 'name email');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user owns the certificate
    if (certificate.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to download this certificate' });
    }

    // In a real implementation, you would generate a PDF certificate here
    // For now, we'll return the certificate data that could be used to generate a PDF
    const certificateData = {
      serialNumber: certificate.serialNumber,
      serialHash: certificate.serialHash,
      userName: certificate.metadata.userName,
      courseName: certificate.metadata.courseTitle,
      creatorName: certificate.metadata.creatorName,
      issuedAt: certificate.issuedAt,
      completionDate: certificate.completionDate,
      grade: certificate.grade,
      validUntil: certificate.validUntil,
      completionTime: certificate.metadata.completionTime,
      courseDuration: certificate.metadata.courseDuration
    };

    res.json({
      message: 'Certificate data generated successfully',
      certificate: certificateData,
      // In a real app, this would be a PDF download URL
      downloadUrl: `/api/certificates/${certificate._id}/pdf`
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ message: 'Server error generating certificate download' });
  }
});

// @route   PUT /api/certificates/:id/revoke
// @desc    Revoke a certificate
// @access  Private (admin only)
router.put('/:id/revoke', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.isRevoked) {
      return res.status(400).json({ message: 'Certificate is already revoked' });
    }

    await certificate.revoke(reason);

    res.json({
      message: 'Certificate revoked successfully',
      certificate
    });
  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({ message: 'Server error revoking certificate' });
  }
});

// @route   GET /api/certificates/course/:courseId/certificates
// @desc    Get all certificates for a course (for course creators)
// @access  Private (course creator only)
router.get('/course/:courseId/certificates', authenticate, authorize('creator'), async (req, res) => {
  try {
    const Course = require('../models/Course');
    
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view certificates for this course' });
    }

    const certificates = await Certificate.find({ course: req.params.courseId })
      .populate('user', 'name email avatar')
      .sort({ issuedAt: -1 });

    res.json({ 
      certificates,
      total: certificates.length 
    });
  } catch (error) {
    console.error('Get course certificates error:', error);
    res.status(500).json({ message: 'Server error fetching course certificates' });
  }
});

// @route   GET /api/certificates/analytics/stats
// @desc    Get certificate analytics (for admins)
// @access  Private (admin only)
router.get('/analytics/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalCertificates = await Certificate.countDocuments();
    const validCertificates = await Certificate.countDocuments({ isRevoked: false });
    const revokedCertificates = await Certificate.countDocuments({ isRevoked: true });
    
    // Get certificates issued in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCertificates = await Certificate.countDocuments({
      issuedAt: { $gte: thirtyDaysAgo }
    });

    // Get top courses by certificate count
    const topCourses = await Certificate.aggregate([
      { $match: { isRevoked: false } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          courseTitle: '$course.title',
          certificateCount: '$count'
        }
      }
    ]);

    res.json({
      stats: {
        totalCertificates,
        validCertificates,
        revokedCertificates,
        recentCertificates,
        topCourses
      }
    });
  } catch (error) {
    console.error('Get certificate analytics error:', error);
    res.status(500).json({ message: 'Server error fetching certificate analytics' });
  }
});

module.exports = router;