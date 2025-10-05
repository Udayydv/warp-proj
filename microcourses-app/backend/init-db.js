// Database initialization script for MicroCourses
// Run this after deployment to set up demo data

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@demo.com' });
    if (existingAdmin) {
      console.log('Demo data already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create demo users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'admin',
      isApproved: true
    });
    
    const creatorUser = await User.create({
      name: 'Demo Creator',
      email: 'creator@demo.com',
      password: hashedPassword,
      role: 'creator',
      isApproved: true,
      creatorApplication: {
        bio: 'Experienced instructor and developer',
        expertise: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        status: 'approved',
        appliedAt: new Date()
      }
    });
    
    const learnerUser = await User.create({
      name: 'Demo Learner',
      email: 'learner@demo.com',
      password: hashedPassword,
      role: 'learner',
      isApproved: true
    });
    
    // Create demo course
    const demoCourse = await Course.create({
      title: 'Introduction to Web Development',
      description: 'Learn the basics of HTML, CSS, and JavaScript to build your first website.',
      category: 'Programming',
      tags: ['HTML', 'CSS', 'JavaScript', 'Web Development'],
      creator: creatorUser._id,
      status: 'published',
      isPublished: true,
      level: 'beginner',
      duration: 120, // 2 hours
    });
    
    // Create demo lessons
    await Lesson.create([
      {
        title: 'HTML Basics',
        description: 'Learn HTML fundamentals and structure',
        course: demoCourse._id,
        order: 1,
        videoUrl: 'https://example.com/video1.mp4',
        videoDuration: 1800, // 30 minutes
        transcript: 'In this lesson, we will cover HTML basics...',
        isTranscriptGenerated: true,
        isPublished: true
      },
      {
        title: 'CSS Styling',
        description: 'Learn to style your HTML with CSS',
        course: demoCourse._id,
        order: 2,
        videoUrl: 'https://example.com/video2.mp4',
        videoDuration: 2100, // 35 minutes
        transcript: 'CSS allows us to style our HTML elements...',
        isTranscriptGenerated: true,
        isPublished: true
      },
      {
        title: 'JavaScript Introduction',
        description: 'Add interactivity with JavaScript',
        course: demoCourse._id,
        order: 3,
        videoUrl: 'https://example.com/video3.mp4',
        videoDuration: 2400, // 40 minutes
        transcript: 'JavaScript brings our websites to life...',
        isTranscriptGenerated: true,
        isPublished: true
      }
    ]);
    
    console.log('✅ Demo data created successfully!');
    console.log('\n🔑 Demo Login Credentials:');
    console.log('Admin: admin@demo.com / admin123');
    console.log('Creator: creator@demo.com / admin123');
    console.log('Learner: learner@demo.com / admin123');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;