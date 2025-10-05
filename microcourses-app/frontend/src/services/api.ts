import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, role: string) =>
    api.post('/auth/register', { name, email, password, role }),
  
  getProfile: () => api.get('/auth/me'),
  
  updateProfile: (data: any) => api.put('/auth/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const userAPI = {
  applyCreator: (data: { bio: string; expertise: string[]; portfolio?: string }) =>
    api.post('/users/apply-creator', data),
  
  getCreatorStatus: () => api.get('/users/creator-status'),
  
  updateCreatorProfile: (data: { bio?: string; expertise?: string[]; portfolio?: string }) =>
    api.put('/users/update-creator-profile', data),
  
  getDashboardStats: () => api.get('/users/dashboard-stats'),
};

export const courseAPI = {
  getCourses: (params?: any) => api.get('/courses', { params }),
  
  getCourse: (id: string) => api.get(`/courses/${id}`),
  
  createCourse: (data: any) => api.post('/courses', data),
  
  updateCourse: (id: string, data: any) => api.put(`/courses/${id}`, data),
  
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),
  
  submitForReview: (id: string) => api.post(`/courses/${id}/submit-review`),
  
  uploadThumbnail: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return api.post(`/courses/${id}/upload-thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const lessonAPI = {
  getCourseLessons: (courseId: string) => api.get(`/lessons/course/${courseId}`),
  
  getLesson: (id: string) => api.get(`/lessons/${id}`),
  
  createLesson: (data: any) => api.post('/lessons', data),
  
  updateLesson: (id: string, data: any) => api.put(`/lessons/${id}`, data),
  
  deleteLesson: (id: string) => api.delete(`/lessons/${id}`),
  
  publishLesson: (id: string, isPublished: boolean) =>
    api.post(`/lessons/${id}/publish`, { isPublished }),
  
  generateTranscript: (id: string) => api.post(`/lessons/${id}/generate-transcript`),
  
  uploadVideo: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post(`/lessons/${id}/upload-video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const enrollmentAPI = {
  enroll: (courseId: string) => api.post(`/enrollments/enroll/${courseId}`),
  
  getMyEnrollments: (status?: string) =>
    api.get('/enrollments/my-enrollments', { params: { status } }),
  
  getProgress: (courseId: string) => api.get(`/enrollments/${courseId}/progress`),
  
  completeLesson: (courseId: string, lessonId: string, watchTime?: number) =>
    api.post(`/enrollments/${courseId}/complete-lesson/${lessonId}`, { watchTime }),
  
  rateCourse: (courseId: string, score: number, review?: string) =>
    api.post(`/enrollments/${courseId}/rate`, { score, review }),
  
  unenroll: (courseId: string) => api.delete(`/enrollments/${courseId}`),
};

export const certificateAPI = {
  getMyCertificates: () => api.get('/certificates/my-certificates'),
  
  getCertificate: (id: string) => api.get(`/certificates/${id}`),
  
  verifyCertificate: (serialNumber: string) =>
    api.get(`/certificates/verify/${serialNumber}`),
  
  downloadCertificate: (id: string) => api.post(`/certificates/${id}/download`),
  
  getCourseCertificates: (courseId: string) =>
    api.get(`/certificates/course/${courseId}/certificates`),
};

export const adminAPI = {
  getCreatorApplications: (status?: string) =>
    api.get('/admin/creator-applications', { params: { status } }),
  
  approveCreatorApplication: (userId: string, action: 'approve' | 'reject', reason?: string) =>
    api.put(`/admin/creator-applications/${userId}/approve`, { action, reason }),
  
  getCourseReviews: (status?: string) =>
    api.get('/admin/course-reviews', { params: { status } }),
  
  approveCourse: (courseId: string, action: 'approve' | 'reject', reason?: string) =>
    api.put(`/admin/course-reviews/${courseId}/approve`, { action, reason }),
  
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  
  updateUserStatus: (userId: string, status: string) =>
    api.put(`/admin/users/${userId}/status`, { status }),
  
  getActivityReport: (startDate?: string, endDate?: string) =>
    api.get('/admin/reports/activity', { params: { startDate, endDate } }),
};

export default api;