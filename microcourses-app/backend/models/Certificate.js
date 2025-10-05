const mongoose = require('mongoose');
const crypto = require('crypto');

const CertificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  serialNumber: {
    type: String,
    unique: true,
    required: true
  },
  serialHash: {
    type: String,
    unique: true,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'Pass'],
    default: 'Pass'
  },
  validUntil: {
    type: Date,
    // Certificates valid for 3 years by default
    default: () => new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
  },
  metadata: {
    courseTitle: String,
    courseDuration: Number,
    completionTime: Number, // time taken to complete in days
    userName: String,
    creatorName: String
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  revokeReason: String
});

// Ensure unique certificate per user per course
CertificateSchema.index({ user: 1, course: 1 }, { unique: true });

// Generate serial number and hash before saving
CertificateSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate unique serial number
    const timestamp = Date.now().toString();
    const randomString = crypto.randomBytes(8).toString('hex');
    this.serialNumber = `MC-${timestamp}-${randomString}`.toUpperCase();
    
    // Generate serial hash for verification
    const hashInput = `${this.user}-${this.course}-${this.serialNumber}-${this.issuedAt}`;
    this.serialHash = crypto.createHash('sha256').update(hashInput).digest('hex');
  }
  next();
});

// Method to verify certificate authenticity
CertificateSchema.methods.verify = function() {
  const hashInput = `${this.user}-${this.course}-${this.serialNumber}-${this.issuedAt}`;
  const computedHash = crypto.createHash('sha256').update(hashInput).digest('hex');
  return computedHash === this.serialHash && !this.isRevoked;
};

// Method to revoke certificate
CertificateSchema.methods.revoke = function(reason) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokeReason = reason || 'No reason provided';
  return this.save();
};

// Static method to verify by serial number
CertificateSchema.statics.verifyBySerial = async function(serialNumber) {
  const certificate = await this.findOne({ serialNumber })
    .populate('user', 'name email')
    .populate('course', 'title')
    .exec();
  
  if (!certificate) {
    return { valid: false, message: 'Certificate not found' };
  }
  
  const isValid = certificate.verify();
  return {
    valid: isValid,
    certificate: isValid ? certificate : null,
    message: isValid ? 'Certificate is valid' : 'Certificate is invalid or revoked'
  };
};

module.exports = mongoose.model('Certificate', CertificateSchema);