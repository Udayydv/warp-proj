# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a MicroCourses MERN stack application - a micro-learning platform with role-based authentication, course creation, video lessons with transcripts, progress tracking, and certificate generation.

## Development Commands

### Setup and Installation
```bash
# Backend setup
cd microcourses-app/backend
npm install

# Frontend setup  
cd microcourses-app/frontend
npm install
```

### Running the Application
```bash
# Start both frontend and backend (Windows)
cd microcourses-app
start.bat

# Or run individually:
# Backend development server
cd microcourses-app/backend
npm run dev

# Frontend development server
cd microcourses-app/frontend
npm start

# Backend production
cd microcourses-app/backend
npm start
```

### Testing
```bash
# Frontend tests
cd microcourses-app/frontend
npm test

# Backend tests (currently not configured)
cd microcourses-app/backend
npm test
```

### Building
```bash
# Frontend production build
cd microcourses-app/frontend
npm run build
```

## Architecture Overview

### Monorepo Structure
- `microcourses-app/backend/` - Node.js/Express REST API
- `microcourses-app/frontend/` - React/TypeScript SPA
- Both apps are deployed separately (backend to Railway, frontend can be static hosting)

### Backend Architecture
- **Framework**: Express.js with RESTful API design
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with role-based access control
- **File Upload**: Multer for video/image handling (local filesystem)
- **Key Models**: User, Course, Lesson, Enrollment, Certificate

### Frontend Architecture  
- **Framework**: React 19 with TypeScript
- **Routing**: React Router v7 with role-based protected routes
- **State Management**: React Context (AuthContext) for authentication
- **Styling**: Tailwind CSS + Headless UI components
- **HTTP Client**: Axios for API communication

### Role-Based System
Three user roles with distinct workflows:
1. **Learners**: Default role, can enroll in courses and track progress
2. **Creators**: Must apply and get admin approval to create courses
3. **Admins**: Approve creators and review/publish courses

### Database Models
- **Users**: Authentication, roles, creator applications
- **Courses**: Course metadata, status workflow (draft → pending_review → published)
- **Lessons**: Video content, transcripts, materials, ordered by course
- **Enrollments**: User progress, completed lessons, certificates
- **Certificates**: Unique serial numbers, verification hashes

## Key Development Workflows

### Authentication Flow
The app uses JWT tokens stored in localStorage with automatic token refresh. All API routes are protected by role-based middleware.

### Course Creation Workflow
1. User applies to become creator (pending admin approval)
2. Approved creator creates course (draft status)
3. Creator adds lessons and submits for review (pending_review)
4. Admin approves course (published status)
5. Learners can then enroll and access content

### API Route Structure
- `/api/auth/*` - Registration, login, profile management  
- `/api/courses/*` - Course CRUD, public course listing
- `/api/lessons/*` - Lesson management within courses
- `/api/enrollments/*` - Enrollment, progress tracking, lesson completion
- `/api/certificates/*` - Certificate generation and verification
- `/api/admin/*` - Creator approval, course review workflows
- `/api/users/*` - User management

### Frontend Route Structure
- Public: `/`, `/courses`, `/courses/:id`, `/login`, `/register`
- Learners: `/progress`, `/learn/:lessonId`, `/creator/apply`
- Creators: `/creator/dashboard` (requires approval)
- Admins: `/admin/review/courses`

## Environment Configuration

### Backend Environment Variables
Required in `microcourses-app/backend/.env`:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRE` - Token expiration (default: 30d)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)

### Frontend Environment Variables  
Required in `microcourses-app/frontend/.env`:
- `REACT_APP_API_URL` - Backend API URL (http://localhost:5000/api for development)

## Database Considerations

### Initial Setup
The app requires manual creation of the first admin user in MongoDB. Use bcrypt to hash passwords before inserting.

### File Storage
Currently uses local filesystem for video/image uploads. Files stored in `backend/uploads/`. For production, consider migrating to cloud storage (AWS S3).

### Indexes
Consider adding database indexes on frequently queried fields:
- `User.email` (unique)
- `Course.creator`, `Course.status`
- `Enrollment.user`, `Enrollment.course`

## Deployment

The application is configured for Railway deployment with `railway.json`. Backend and frontend are deployed as separate services. See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Testing Notes

- Frontend includes React Testing Library setup
- Backend tests are not currently implemented
- Manual testing workflows are documented in the deployment guide
- Certificate verification uses cryptographic hashes for authenticity