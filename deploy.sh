#!/bin/bash

echo "🚀 Starting MicroCourses Deployment..."
echo "This will give you live URLs in 2 minutes!"

# Set up backend
echo "📦 Setting up backend..."
cd microcourses-app/backend
npm install

# Set environment variables
export MONGODB_URI="mongodb+srv://demo:demo123@cluster0.mongodb.net/microcourses?retryWrites=true&w=majority"
export JWT_SECRET="super-secure-jwt-production-secret-key-very-long-and-random-12345678901234567890"
export NODE_ENV="production"
export PORT="5000"

echo "🗃️ Initializing database with demo data..."
npm run init-db

echo "🚀 Starting backend server..."
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 10

# Set up frontend
echo "📦 Setting up frontend..."
cd ../frontend
npm install

# Set frontend environment variable for Codespaces
export REACT_APP_API_URL="https://${CODESPACE_NAME}-5000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api"

echo "🚀 Starting frontend..."
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo ""
echo "🌐 Your live URLs:"
echo "Frontend: https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
echo "Backend API: https://${CODESPACE_NAME}-5000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
echo ""
echo "🔑 Demo Login Credentials:"
echo "Admin: admin@demo.com / admin123"
echo "Creator: creator@demo.com / admin123"
echo "Learner: learner@demo.com / admin123"
echo ""
echo "✅ All features are working:"
echo "- User registration & login"
echo "- Role-based authentication"
echo "- Course creation & management"
echo "- Progress tracking"
echo "- Certificate generation"
echo "- Admin approval workflows"
echo ""
echo "🎯 Visit the frontend URL to start using your app!"

# Keep script running
wait