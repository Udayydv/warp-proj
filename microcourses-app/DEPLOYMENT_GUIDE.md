# MicroCourses MERN Stack Deployment Guide

## Overview
This is a complete MERN stack application for a micro-learning platform with the following features:
- Role-based authentication (Learner, Creator, Admin)
- Course creation and management
- Video lessons with auto-generated transcripts
- Progress tracking and certificates
- Admin approval workflows

## Architecture
- **Backend**: Node.js + Express + MongoDB Atlas
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: MongoDB Atlas (cloud)
- **File Storage**: Local filesystem (can be upgraded to AWS S3)

## Prerequisites
1. Node.js 16+ installed
2. MongoDB Atlas account
3. Deployment platform account (Render, Railway, or Heroku)

## Quick Setup

### 1. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb+srv://kumarshah7755_db_user:YOUR_ACTUAL_PASSWORD@cluster0.mifccxm.mongodb.net/microcourses?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRE=30d
NODE_ENV=production
PORT=5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Create Initial Admin User
Once deployed, you'll need to manually create an admin user in MongoDB:

```javascript
// Connect to your MongoDB and run this script
db.users.insertOne({
  name: "Admin User",
  email: "admin@microcourses.app",
  password: "$2a$12$example_hashed_password", // Use bcrypt to hash "admin123"
  role: "admin",
  isApproved: true,
  createdAt: new Date()
});
```

## Deployment Options

### Option 1: Railway (Recommended)
1. Push your code to GitHub
2. Connect Railway to your GitHub repo
3. Deploy backend and frontend as separate services
4. Set environment variables in Railway dashboard

### Option 2: Render
1. Push your code to GitHub
2. Create a new web service for backend
3. Create a static site for frontend
4. Configure environment variables

### Option 3: Heroku
1. Install Heroku CLI
2. Create two apps (backend and frontend)
3. Deploy using Git

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
NODE_ENV=production
PORT=5000
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

## Database Schema

The application includes the following models:
- **Users**: Authentication and role management
- **Courses**: Course information and metadata
- **Lessons**: Video lessons with transcripts
- **Enrollments**: User progress tracking
- **Certificates**: Verified completion certificates

## Key Features

### Authentication Flow
1. Users register as learners or creators
2. Creators need admin approval
3. Role-based access control

### Course Creation Flow
1. Approved creators create courses
2. Add lessons with videos
3. Submit for admin review
4. Admin approves/rejects courses
5. Published courses visible to learners

### Learning Flow
1. Learners browse and enroll in courses
2. Watch lessons and track progress
3. Complete courses to earn certificates
4. Certificates have unique serial numbers

### Admin Functions
1. Review and approve creator applications
2. Review and approve/reject courses
3. View platform analytics
4. Manage users

## API Endpoints

### Authentication
- POST /api/auth/register - Register user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Courses
- GET /api/courses - Get published courses
- GET /api/courses/:id - Get course details
- POST /api/courses - Create course (creators)
- PUT /api/courses/:id - Update course
- DELETE /api/courses/:id - Delete course

### Enrollments
- POST /api/enrollments/enroll/:courseId - Enroll in course
- GET /api/enrollments/my-enrollments - Get user enrollments
- POST /api/enrollments/:courseId/complete-lesson/:lessonId - Mark lesson complete

### Admin
- GET /api/admin/creator-applications - Get pending applications
- PUT /api/admin/creator-applications/:userId/approve - Approve/reject creator
- GET /api/admin/course-reviews - Get courses pending review
- PUT /api/admin/course-reviews/:courseId/approve - Approve/reject course

## Frontend Routes

### Public Routes
- `/` - Home page
- `/courses` - Course catalog
- `/courses/:id` - Course details
- `/login` - Login page
- `/register` - Registration page

### Learner Routes
- `/progress` - Learning progress
- `/learn/:lessonId` - Lesson player
- `/creator/apply` - Apply to become creator

### Creator Routes
- `/creator/dashboard` - Creator dashboard

### Admin Routes
- `/admin/review/courses` - Course review panel

## Demo Data

To populate your database with demo data, you can use the following script:

```javascript
// Demo users (passwords should be hashed with bcrypt)
const demoUsers = [
  {
    name: "John Admin",
    email: "admin@demo.com",
    password: "hashed_password",
    role: "admin",
    isApproved: true
  },
  {
    name: "Jane Creator",
    email: "creator@demo.com", 
    password: "hashed_password",
    role: "creator",
    isApproved: true,
    creatorApplication: {
      bio: "Experienced developer and instructor",
      expertise: ["JavaScript", "React", "Node.js"],
      status: "approved"
    }
  },
  {
    name: "Bob Learner",
    email: "learner@demo.com",
    password: "hashed_password", 
    role: "learner",
    isApproved: true
  }
];
```

## Security Considerations

1. **Authentication**: JWT tokens with secure secrets
2. **Authorization**: Role-based access control
3. **Input Validation**: All API endpoints validate input
4. **File Upload**: Restricted file types and sizes
5. **CORS**: Configured for production domains

## Monitoring and Maintenance

1. Monitor database usage in MongoDB Atlas
2. Check application logs for errors
3. Regular backups of certificate data
4. Update dependencies regularly

## Support and Documentation

The application includes:
- Comprehensive error handling
- API documentation in code comments
- Type definitions for TypeScript
- Responsive UI design
- Mobile-friendly interface

## Scaling Considerations

For production scaling:
1. Use CDN for static assets
2. Implement Redis for session management
3. Add database indexing
4. Use AWS S3 for file storage
5. Implement rate limiting
6. Add monitoring tools (New Relic, DataDog)

## Live Demo

Once deployed, your application will have:
- Complete user registration and authentication
- Course creation and management
- Video lesson playback
- Progress tracking
- Certificate generation
- Admin panel for approvals

The application is production-ready and can handle multiple users, courses, and concurrent access.