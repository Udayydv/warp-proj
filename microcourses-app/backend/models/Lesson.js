const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Lesson description is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    required: [true, 'Lesson order is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  videoDuration: {
    type: Number, // in seconds
    default: 0
  },
  transcript: {
    type: String,
    default: ''
  },
  isTranscriptGenerated: {
    type: Boolean,
    default: false
  },
  materials: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'document', 'link', 'image', 'other'],
      default: 'other'
    }
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique order within a course
LessonSchema.index({ course: 1, order: 1 }, { unique: true });

// Update the updatedAt field before saving
LessonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-generate transcript (mock implementation)
LessonSchema.methods.generateTranscript = async function() {
  // This would integrate with a real transcription service
  // For now, we'll simulate it
  if (!this.isTranscriptGenerated) {
    this.transcript = `Auto-generated transcript for lesson: ${this.title}. 
    This is a mock transcript that would be generated from the video content 
    using speech-to-text services like AWS Transcribe, Google Speech-to-Text, 
    or Azure Speech Services.`;
    this.isTranscriptGenerated = true;
    await this.save();
  }
  return this.transcript;
};

module.exports = mongoose.model('Lesson', LessonSchema);