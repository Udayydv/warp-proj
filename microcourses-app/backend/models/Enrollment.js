const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
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
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedLessons: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    watchTime: {
      type: Number, // in seconds
      default: 0
    }
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique enrollment per user per course
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Method to calculate and update progress
EnrollmentSchema.methods.updateProgress = async function() {
  const Lesson = require('./Lesson');
  const totalLessons = await Lesson.countDocuments({ 
    course: this.course, 
    isPublished: true 
  });
  
  if (totalLessons === 0) {
    this.progress = 0;
    return;
  }
  
  const completedCount = this.completedLessons.length;
  this.progress = Math.round((completedCount / totalLessons) * 100);
  
  // Mark as completed if all lessons are done
  if (this.progress === 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  await this.save();
  return this.progress;
};

// Method to complete a lesson
EnrollmentSchema.methods.completeLesson = async function(lessonId, watchTime = 0) {
  const existingCompletion = this.completedLessons.find(
    cl => cl.lesson.toString() === lessonId.toString()
  );
  
  if (!existingCompletion) {
    this.completedLessons.push({
      lesson: lessonId,
      completedAt: new Date(),
      watchTime: watchTime
    });
    
    await this.updateProgress();
  }
  
  return this;
};

module.exports = mongoose.model('Enrollment', EnrollmentSchema);