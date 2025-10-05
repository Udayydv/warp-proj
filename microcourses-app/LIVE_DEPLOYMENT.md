# MicroCourses Live Deployment Guide

## Quick Deploy to Get Live Link

### Option 1: Railway (Recommended - Free Tier)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial MicroCourses app"
   git branch -M main
   git remote add origin https://github.com/yourusername/microcourses-app.git
   git push -u origin main
   ```

2. **Deploy Backend**:
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set root directory to `/backend`
   - Add environment variables:
     ```
     MONGODB_URI=mongodb+srv://kumarshah7755_db_user:YOUR_PASSWORD@cluster0.mifccxm.mongodb.net/microcourses?retryWrites=true&w=majority&appName=Cluster0
     JWT_SECRET=super_secure_random_key_for_production_use
     JWT_EXPIRE=30d
     NODE_ENV=production
     PORT=5000
     ```
   - Deploy (you'll get a URL like: https://backend-production-xxxx.up.railway.app)

3. **Deploy Frontend**:
   - Create another Railway service
   - Select same GitHub repo
   - Set root directory to `/frontend`
   - Add environment variables:
     ```
     REACT_APP_API_URL=https://your-backend-url.up.railway.app/api
     ```
   - Deploy (you'll get a URL like: https://frontend-production-yyyy.up.railway.app)

### Option 2: Render (Also Free)

1. **Backend on Render**:
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect GitHub repo
   - Settings:
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Add environment variables in Render dashboard

2. **Frontend on Render**:
   - Create new Static Site
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `build`

### Option 3: Heroku

1. **Backend**:
   ```bash
   cd backend
   heroku create microcourses-backend
   heroku config:set MONGODB_URI="your_connection_string"
   heroku config:set JWT_SECRET="your_jwt_secret"
   git init
   git add .
   git commit -m "Backend"
   git push heroku main
   ```

2. **Frontend**:
   ```bash
   cd ../frontend
   heroku create microcourses-frontend
   heroku buildpacks:set mars/create-react-app
   heroku config:set REACT_APP_API_URL="https://microcourses-backend.herokuapp.com/api"
   git init
   git add .
   git commit -m "Frontend"
   git push heroku main
   ```

## Database Setup

1. **MongoDB Atlas**:
   - Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Create free cluster
   - Create database user
   - Get connection string
   - Replace `<db_password>` with your actual password

2. **Initial Admin User** (Run in MongoDB Compass or Atlas shell):
   ```javascript
   use microcourses
   
   // Hash password using bcrypt online tool or Node.js
   // Password: admin123 → Hashed: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVu0UJXa.0PX2Pny
   
   db.users.insertOne({
     name: "Admin User",
     email: "admin@demo.com",
     password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVu0UJXa.0PX2Pny",
     role: "admin",
     isApproved: true,
     createdAt: new Date()
   })
   
   // Create demo creator
   db.users.insertOne({
     name: "Demo Creator",
     email: "creator@demo.com", 
     password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVu0UJXa.0PX2Pny",
     role: "creator",
     isApproved: true,
     creatorApplication: {
       bio: "Demo creator for testing",
       expertise: ["JavaScript", "React"],
       status: "approved",
       appliedAt: new Date()
     },
     createdAt: new Date()
   })
   
   // Create demo learner
   db.users.insertOne({
     name: "Demo Learner",
     email: "learner@demo.com",
     password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVu0UJXa.0PX2Pny", 
     role: "learner",
     isApproved: true,
     createdAt: new Date()
   })
   ```

## Testing Your Live Application

Once deployed, you can:

1. **Visit your frontend URL**
2. **Register new accounts**:
   - Learner accounts work immediately
   - Creator accounts need admin approval
   - Use admin account to approve creators

3. **Login with demo accounts**:
   - **Admin**: admin@demo.com / admin123
   - **Creator**: creator@demo.com / admin123  
   - **Learner**: learner@demo.com / admin123

4. **Test the complete flow**:
   - Learner registers → enrolls in courses → tracks progress
   - Creator applies → admin approves → creator creates courses → admin reviews → courses published
   - Complete workflow with certificates

## Expected Live Features

Your deployed application will have:

✅ **Authentication System**
- User registration and login
- JWT-based authentication
- Role-based access control

✅ **Course Management**
- Course creation by approved creators
- Admin review and approval process
- Course catalog for learners

✅ **Learning Platform**
- Course enrollment
- Progress tracking
- Lesson completion
- Certificate generation with unique serial numbers

✅ **Admin Panel**
- Creator application reviews
- Course approval workflow
- User management
- Platform analytics

✅ **Responsive Design**
- Mobile-friendly interface
- Modern UI with Tailwind CSS
- Professional styling

## API Documentation

Your live API will be available at `https://your-backend-url.com/api` with endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/courses` - Get published courses
- `POST /api/enrollments/enroll/:courseId` - Enroll in course
- `GET /api/admin/creator-applications` - Admin: Get creator applications
- And many more...

## Troubleshooting

1. **CORS Issues**: Ensure frontend URL is allowed in backend CORS config
2. **MongoDB Connection**: Verify connection string and IP whitelist
3. **Environment Variables**: Double-check all environment variables are set correctly
4. **Build Errors**: Check that all dependencies are properly installed

## Domain Setup (Optional)

After deployment, you can:
1. Purchase a custom domain
2. Point it to your Railway/Render/Heroku apps
3. Enable SSL certificates automatically

## Maintenance

- Monitor logs in your deployment platform dashboard
- Update MongoDB password regularly
- Monitor database usage in Atlas
- Keep dependencies updated

Your live application will be fully functional with all the features described in the problem statement!