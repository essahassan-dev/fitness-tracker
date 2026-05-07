import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fittrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fittrack_token');
      localStorage.removeItem('fittrack_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// Dashboard
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard'),
};

// Workouts
export const workoutAPI = {
  getAll: (params) => api.get('/workouts', { params }),
  getOne: (id) => api.get(`/workouts/${id}`),
  create: (data) => api.post('/workouts', data),
  update: (id, data) => api.put(`/workouts/${id}`, data),
  delete: (id) => api.delete(`/workouts/${id}`),
  getAnalytics: (params) => api.get('/workouts/analytics', { params }),
};

// Nutrition
export const nutritionAPI = {
  getAll: (params) => api.get('/nutrition', { params }),
  getDaily: (params) => api.get('/nutrition/daily', { params }),
  create: (data) => api.post('/nutrition', data),
  update: (id, data) => api.put(`/nutrition/${id}`, data),
  delete: (id) => api.delete(`/nutrition/${id}`),
  getAnalytics: (params) => api.get('/nutrition/analytics', { params }),
};

// Progress
export const progressAPI = {
  getAll: (params) => api.get('/progress', { params }),
  getChart: (params) => api.get('/progress/chart', { params }),
  create: (data) => api.post('/progress', data),
  update: (id, data) => api.put(`/progress/${id}`, data),
  delete: (id) => api.delete(`/progress/${id}`),
};

// Admin
export const adminAPI = {
  getStats:        ()           => api.get('/admin/stats'),
  getUsers:        (params)     => api.get('/admin/users', { params }),
  getUserProfile:  (id)         => api.get(`/admin/users/${id}`),
  getUserWorkouts: (id, params) => api.get(`/admin/users/${id}/workouts`, { params }),
  getUserNutrition:(id, params) => api.get(`/admin/users/${id}/nutrition`, { params }),
  getUserProgress: (id)         => api.get(`/admin/users/${id}/progress`),
  updateRole:      (id, role)   => api.put(`/admin/users/${id}/role`, { role }),
  toggleStatus:    (id)         => api.put(`/admin/users/${id}/status`),
  deleteUser:      (id)         => api.delete(`/admin/users/${id}`),
};

export default api;
