import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Courses from './pages/courses/Courses';
import CourseDetail from './pages/courses/CourseDetail';
import Learn from './pages/courses/Learn';
import Progress from './pages/learner/Progress';
import CreatorApply from './pages/creator/CreatorApply';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import AdminReview from './pages/admin/AdminReview';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              
              {/* Learner Routes */}
              <Route
                path="/learn/:lessonId"
                element={
                  <ProtectedRoute roles={['learner']}>
                    <Learn />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute roles={['learner']}>
                    <Progress />
                  </ProtectedRoute>
                }
              />
              
              {/* Creator Routes */}
              <Route
                path="/creator/apply"
                element={
                  <ProtectedRoute roles={['learner']}>
                    <CreatorApply />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/creator/dashboard"
                element={
                  <ProtectedRoute roles={['creator']} requireApproval={true}>
                    <CreatorDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Admin Routes */}
              <Route
                path="/admin/review/courses"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminReview />
                  </ProtectedRoute>
                }
              />
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
