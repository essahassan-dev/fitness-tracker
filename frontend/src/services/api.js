import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('FitStack_token');
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
      localStorage.removeItem('FitStack_token');
      localStorage.removeItem('FitStack_user');
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

// Trainer
export const trainerAPI = {
  getMyUsers:       ()               => api.get('/trainer/my-users'),
  getUserProgress:  (userId)         => api.get(`/trainer/my-users/${userId}/progress`),
  getRemarks:       (userId)         => api.get(`/trainer/my-users/${userId}/remarks`),
  sendRemark:       (userId, data)   => api.post(`/trainer/my-users/${userId}/remarks`, data),
  getMyRemarks:     ()               => api.get('/trainer/remarks/me'),
  getUnreadCount:   ()               => api.get('/trainer/remarks/unread'),
  getAllTrainers:    ()               => api.get('/trainer'),
  createTrainer:    (data)           => api.post('/trainer', data),
  assignUser:       (data)           => api.post('/trainer/assign', data),
  unassignUser:     (data)           => api.post('/trainer/unassign', data),
  deleteTrainer:    (id)             => api.delete(`/trainer/${id}`),
};

// Super Admin
export const superAdminAPI = {
  getStats:        ()           => api.get('/super-admin/stats'),
  getAllAdmins:     (params)     => api.get('/super-admin/admins', { params }),
  getAdminDetail:  (id)         => api.get(`/super-admin/admins/${id}`),
  createAdmin:     (data)       => api.post('/super-admin/admins', data),
  toggleStatus:    (id, data)   => api.put(`/super-admin/admins/${id}/status`, data),
  deleteAdmin:     (id)         => api.delete(`/super-admin/admins/${id}`),
  getAllUsers:      (params)     => api.get('/super-admin/users', { params }),
  banUser:         (id, data)   => api.put(`/super-admin/users/${id}/ban`, data),
};

// Gamification
export const gamificationAPI = {
  getMyStats:    ()       => api.get('/gamification/me'),
  getLeaderboard:(params) => api.get('/gamification/leaderboard', { params }),
  getAllBadges:   ()       => api.get('/gamification/badges'),
};

// AI
export const aiAPI = {
  chat:            (data)  => api.post('/ai/chat', data),
  predictProgress: ()      => api.post('/ai/predict-progress'),
  workoutInsight:  (data)  => api.post('/ai/workout-insight', data),
  notifyAdmin:     (data)  => api.post('/ai/notify-admin', data),
};
export const notificationAPI = {
  getAll:   ()    => api.get('/notifications'),
  markRead: ()    => api.put('/notifications/read'),
  deleteOne:(id)  => api.delete(`/notifications/${id}`),
  clearAll: ()    => api.delete('/notifications/all'),
};

// Attendance Requests (manual)
export const attendanceRequestAPI = {
  submit:    (data)  => api.post('/attendance-requests', data),
  getMy:     ()      => api.get('/attendance-requests/my'),
  getAll:    (params)=> api.get('/attendance-requests', { params }),
  approve:   (id, data) => api.put(`/attendance-requests/${id}/approve`, data),
  reject:    (id, data) => api.put(`/attendance-requests/${id}/reject`, data),
};

// Fees
export const feeAPI = {
  getAll:    (params)=> api.get('/fees', { params }),
  save:      (data)  => api.post('/fees', data),
  delete:    (id)    => api.delete(`/fees/${id}`),
  generate:  (data)  => api.post('/fees/generate', data),
};

// Attendance
export const attendanceAPI = {
  generateQR:       ()           => api.get('/attendance/qr'),
  scan:             (qrToken)    => api.post('/attendance/scan', { qrToken }),
  getMy:            (params)     => api.get('/attendance/my', { params }),
  getAll:           (params)     => api.get('/attendance', { params }),
  getTrainer:       (params)     => api.get('/attendance/trainer', { params }),
  manualMark:       (data)       => api.post('/attendance/manual', data),
  delete:           (id)         => api.delete(`/attendance/${id}`),
};

// Daily Diet Plan
export const dailyDietAPI = {
  getToday:    ()               => api.get('/daily-diet/today'),
  start:       (dietPlanId)     => api.post('/daily-diet/start', { dietPlanId }),
  toggleMeal:  (planId, idx)    => api.patch(`/daily-diet/${planId}/meal/${idx}/toggle`),
};

// Weekly Plan
export const weeklyPlanAPI = {
  getCurrent:       (params)         => api.get('/weekly-plan/current', { params }),
  regenerate:       (equipmentType)  => api.post('/weekly-plan/regenerate', { equipmentType }),
  getHistory:       ()               => api.get('/weekly-plan/history'),
  toggleExercise:   (planId, day, exIdx) => api.patch(`/weekly-plan/${planId}/day/${day}/exercise/${exIdx}/toggle`),
  toggleDay:        (planId, day)    => api.patch(`/weekly-plan/${planId}/day/${day}/toggle`),
};

// Upgrade Requests
export const upgradeAPI = {
  submit:   (data)  => api.post('/upgrade', data),
  getMyRequest: ()  => api.get('/upgrade/me'),
  getAll:   (params)=> api.get('/upgrade', { params }),
  approve:  (id, data) => api.put(`/upgrade/${id}/approve`, data),
  reject:   (id, data) => api.put(`/upgrade/${id}/reject`, data),
};

// Subscription
export const subscriptionAPI = {
  getStatus:  ()               => api.get('/subscription'),
  activate:   (days)           => api.post('/subscription/activate', { durationDays: days }),
  cancel:     ()               => api.post('/subscription/cancel'),
  adminSet:   (userId, data)   => api.put(`/subscription/admin/${userId}`, data),
};

// Recommendations
export const recommendationAPI = {
  getAll:      ()               => api.get('/recommendations'),
  getExercises:(equipmentType)  => api.get('/recommendations/exercises', { params: { equipmentType } }),
  getDiet:     ()               => api.get('/recommendations/diet'),
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

// Violations & Rules
export const violationAPI = {
  getRules:           ()              => api.get('/violations/rules'),
  getAll:             (params)        => api.get('/violations', { params }),
  create:             (data)          => api.post('/violations', data),
  getBlacklist:       ()              => api.get('/violations/blacklist'),
  getUserViolations:  (userId)        => api.get(`/violations/user/${userId}`),
  resolve:            (id, data)      => api.put(`/violations/${id}/resolve`, data),
  dismiss:            (id)            => api.put(`/violations/${id}/dismiss`, {}),
  report:             (data)          => api.post('/violations/report', data),
};

export default api;
