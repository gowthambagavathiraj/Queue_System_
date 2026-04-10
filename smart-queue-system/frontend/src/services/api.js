import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (otp, newPassword) => api.post('/auth/reset-password', { otp, newPassword }),
};

export const userAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
};

export const orgAPI = {
  getAll: () => api.get('/organizations'),
  getServices: (orgId) => api.get(`/organizations/${orgId}/services`),
  checkAvailability: (orgId) => api.get(`/tokens/availability/${orgId}`),
  createOrganization: (data) => api.post('/admin/organizations', data),
  updateOrganization: (orgId, data) => api.put(`/admin/organizations/${orgId}`, data),
  getOrganizationStats: (orgId) => api.get(`/admin/organizations/${orgId}/stats`),
};

export const tokenAPI = {
  generate: (data) => api.post('/tokens/generate', data),
  myTokens: () => api.get('/tokens/my-tokens'),
  editToken: (tokenId, data) => api.put(`/tokens/edit/${tokenId}`, data),
  cancelToken: (tokenId) => api.delete(`/tokens/cancel/${tokenId}`),
  getDailyStats: (orgId) => api.get(`/tokens/stats/${orgId}`),
  getAvailableSlots: (serviceId, date) => api.get(`/tokens/available-slots/${serviceId}?date=${date}`),
};

export const staffAPI = {
  callNext: (serviceId) => api.post(`/tokens/staff/next/${serviceId}`),
  markAttendance: (tokenId, attended) => api.post('/tokens/staff/attendance', { tokenId, attended }),
  getQueue: (serviceId, date) => api.get(`/tokens/staff/queue/${serviceId}${date ? `?date=${date}` : ''}`),
};

export default api;
