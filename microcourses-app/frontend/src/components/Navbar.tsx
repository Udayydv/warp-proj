import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold">
            MicroCourses
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link to="/courses" className="hover:text-blue-200">
              Courses
            </Link>

            {/* User-specific navigation */}
            {user ? (
              <>
                {/* Learner Links */}
                {user.role === 'learner' && (
                  <>
                    <Link to="/progress" className="hover:text-blue-200">
                      My Progress
                    </Link>
                    <Link to="/creator/apply" className="hover:text-blue-200">
                      Become Creator
                    </Link>
                  </>
                )}

                {/* Creator Links */}
                {user.role === 'creator' && user.isApproved && (
                  <Link to="/creator/dashboard" className="hover:text-blue-200">
                    Dashboard
                  </Link>
                )}

                {/* Admin Links */}
                {user.role === 'admin' && (
                  <Link to="/admin/review/courses" className="hover:text-blue-200">
                    Admin Panel
                  </Link>
                )}

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm">
                    Welcome, {user.name}
                    {user.role === 'creator' && !user.isApproved && (
                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-500 rounded">
                        Pending Approval
                      </span>
                    )}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <Link 
                  to="/login" 
                  className="hover:text-blue-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;