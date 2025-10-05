import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import { courseAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getCourses({ limit: 6 });
        setCourses(response.data.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg mb-12">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to MicroCourses
        </h1>
        <p className="text-xl mb-8 max-w-3xl mx-auto">
          Learn new skills, earn certificates, and advance your career with our 
          comprehensive online learning platform. Join thousands of learners 
          and expert creators.
        </p>
        {!user && (
          <div className="space-x-4">
            <Link 
              to="/register" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Get Started
            </Link>
            <Link 
              to="/courses" 
              className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">🎓</div>
          <h3 className="text-xl font-semibold mb-2">Expert-Led Courses</h3>
          <p className="text-gray-600">
            Learn from industry experts and approved creators with real-world experience.
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">📜</div>
          <h3 className="text-xl font-semibold mb-2">Verified Certificates</h3>
          <p className="text-gray-600">
            Earn certificates with unique serial numbers and blockchain verification.
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
          <p className="text-gray-600">
            Track your learning progress and see how far you've come.
          </p>
        </div>
      </section>

      {/* Featured Courses */}
      <section>
        <h2 className="text-3xl font-bold mb-8">Featured Courses</h2>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="bg-gray-300 h-48 rounded mb-4"></div>
                <div className="bg-gray-300 h-4 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">📚</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">{course.category}</span>
                      <span className="text-sm font-medium">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-yellow-400">
                        <span>⭐</span>
                        <span className="ml-1 text-gray-600 text-sm">
                          {course.rating.average.toFixed(1)} ({course.rating.count})
                        </span>
                      </div>
                      <Link 
                        to={`/courses/${course._id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        View Course
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link 
                to="/courses" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                View All Courses
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Call to Action */}
      {user && user.role === 'learner' && (
        <section className="bg-blue-50 rounded-lg p-8 mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Share Your Knowledge?</h2>
          <p className="text-gray-600 mb-6">
            Become a creator and start teaching thousands of learners worldwide.
          </p>
          <Link 
            to="/creator/apply" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Apply to Become a Creator
          </Link>
        </section>
      )}
    </div>
  );
};

export default Home;