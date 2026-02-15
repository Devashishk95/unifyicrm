import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unify-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('unify-token');
      localStorage.removeItem('unify-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  studentLogin: (data) => api.post('/auth/student/login', data),
  me: () => api.get('/auth/me'),
};

// Super Admin APIs
export const superAdminAPI = {
  dashboard: () => api.get('/superadmin/dashboard'),
  listUniversities: (params) => api.get('/superadmin/universities', { params }),
  getUniversity: (id) => api.get(`/superadmin/universities/${id}`),
  createUniversity: (data) => api.post('/superadmin/universities', data),
  updateUniversity: (id, data) => api.put(`/superadmin/universities/${id}`, data),
  paymentsOverview: () => api.get('/superadmin/payments/overview'),
  analytics: () => api.get('/superadmin/analytics'),
};

// University APIs
export const universityAPI = {
  dashboard: () => api.get('/university/dashboard'),
  getConfig: () => api.get('/university/config'),
  updateRegistrationConfig: (data) => api.put('/university/config/registration', data),
  
  // Staff
  createStaff: (data) => api.post('/university/staff', data),
  listStaff: (role) => api.get('/university/staff', { params: { role } }),
  resetPassword: (userId, password) => api.put(`/university/staff/${userId}/reset-password`, { new_password: password }),
  
  // Departments
  createDepartment: (data) => api.post('/university/departments', data),
  listDepartments: () => api.get('/university/departments'),
  updateDepartment: (id, data) => api.put(`/university/departments/${id}`, data),
  
  // Courses
  createCourse: (data) => api.post('/university/courses', data),
  listCourses: (deptId) => api.get('/university/courses', { params: { department_id: deptId } }),
  updateCourse: (id, data) => api.put(`/university/courses/${id}`, data),
  
  // Sessions
  createSession: (data) => api.post('/university/sessions', data),
  listSessions: () => api.get('/university/sessions'),
};

// Lead APIs
export const leadAPI = {
  create: (data) => api.post('/leads', data),
  list: (params) => api.get('/leads', { params }),
  get: (id) => api.get(`/leads/${id}`),
  updateStage: (id, data) => api.put(`/leads/${id}/stage`, data),
  assign: (id, counsellorId) => api.post(`/leads/${id}/assign`, { counsellor_id: counsellorId }),
  bulkReassign: (data) => api.post('/leads/bulk-reassign', data),
  addNote: (id, content) => api.post(`/leads/${id}/notes`, { content }),
  addFollowUp: (id, data) => api.post(`/leads/${id}/follow-ups`, data),
  importShiksha: (leads) => api.post('/leads/import/shiksha', { source: 'shiksha', leads }),
  importCollegedunia: (leads) => api.post('/leads/import/collegedunia', { source: 'collegedunia', leads }),
};

// Application APIs
export const applicationAPI = {
  create: (data) => api.post('/applications', data),
  getMyApplications: () => api.get('/applications/my-applications'),
  get: (id) => api.get(`/applications/${id}`),
  updateBasicInfo: (id, data) => api.put(`/applications/${id}/basic-info`, data),
  updateEducationalDetails: (id, data) => api.put(`/applications/${id}/educational-details`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
};

// Test APIs
export const testAPI = {
  createQuestion: (data) => api.post('/tests/questions', data),
  listQuestions: (params) => api.get('/tests/questions', { params }),
  createConfig: (data) => api.post('/tests/configs', data),
  listConfigs: () => api.get('/tests/configs'),
  startTest: (applicationId) => api.post(`/tests/start/${applicationId}`),
  submitTest: (attemptId, responses) => api.post(`/tests/submit/${attemptId}`, { responses }),
};

// Payment APIs
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  initiateRefund: (paymentId, data) => api.post(`/payments/${paymentId}/refund`, data),
  list: (params) => api.get('/payments', { params }),
  getMyPayments: () => api.get('/payments/my-payments'),
};

// Student APIs
export const studentAPI = {
  register: (data, universityCode) => api.post('/student/register', { ...data, university_code: universityCode }),
  getRegistrationConfig: () => api.get('/student/registration-config'),
  getUniversityInfo: () => api.get('/student/university-info'),
};

// Document APIs
export const documentAPI = {
  upload: (data) => api.post('/documents/upload', data),
  getApplicationDocuments: (applicationId) => api.get(`/documents/application/${applicationId}`),
  getMyDocuments: () => api.get('/documents/my-documents'),
  verify: (documentId, data) => api.put(`/documents/${documentId}/verify`, data),
  delete: (documentId) => api.delete(`/documents/${documentId}`),
};

// Counselling Manager APIs
export const counsellingManagerAPI = {
  getDashboard: () => api.get('/counselling/dashboard'),
  getTeamStats: () => api.get('/counselling/team'),
  getLeadAnalytics: () => api.get('/counselling/lead-analytics'),
};

// Counsellor APIs
export const counsellorAPI = {
  getDashboard: () => api.get('/counsellor/dashboard'),
  getMyLeads: (params) => api.get('/counsellor/leads', { params }),
};

// Student Query APIs
export const queryAPI = {
  create: (data) => api.post('/queries', data),
  getMyQueries: (status) => api.get('/queries/my-queries', { params: { status } }),
  getCounsellorQueries: (status) => api.get('/queries/counsellor-queries', { params: { status } }),
  getAllQueries: (params) => api.get('/queries/all', { params }),
  get: (id) => api.get(`/queries/${id}`),
  reply: (id, message) => api.post(`/queries/${id}/reply`, { message }),
  updateStatus: (id, status) => api.put(`/queries/${id}/status`, { status }),
  getStats: () => api.get('/queries/stats/summary'),
};

// Public APIs
export const publicAPI = {
  listUniversities: () => api.get('/public/universities'),
};

export default api;
