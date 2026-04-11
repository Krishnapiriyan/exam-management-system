import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('ems_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is missing, invalid, or expired — clear session and redirect
            localStorage.removeItem('ems_token');
            localStorage.removeItem('ems_admin');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (data) => API.post('/auth/login', data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getGlobalStats = () => API.get('/dashboard/stats');
export const getBatchStats = (batchId) => API.get(`/dashboard/batch/${batchId}/stats`);

// ── Subjects ──────────────────────────────────────────────────────────────────
export const getSubjects = () => API.get('/subjects');

// ── Batches ───────────────────────────────────────────────────────────────────
export const getBatches = () => API.get('/batches');
export const createBatch = (data) => API.post('/batches', data);
export const updateBatch = (id, data) => API.put(`/batches/${id}`, data);
export const deleteBatch = (id) => API.delete(`/batches/${id}`);

// ── Students ──────────────────────────────────────────────────────────────────
export const getStudentsByBatch = (batchId) => API.get(`/batches/${batchId}/students`);
export const getStudentById = (id) => API.get(`/students/${id}`);
export const createStudent = (batchId, data) => API.post(`/batches/${batchId}/students`, data);
export const updateStudent = (id, data) => API.put(`/students/${id}`, data);
export const deleteStudent = (id) => API.delete(`/students/${id}`);
export const getStudentResults = (id) => API.get(`/students/${id}/results`);
export const verifyStudent = (data) => API.post('/students/verify', data);

// ── Exams ─────────────────────────────────────────────────────────────────────
export const getAllExams = () => API.get('/exams');
export const getExamsByBatchSubject = (batchId, subjectId) =>
    API.get(`/batches/${batchId}/subjects/${subjectId}/exams`);
export const getExamById = (id) => API.get(`/exams/${id}`);
export const createExam = (batchId, subjectId, data) =>
    API.post(`/batches/${batchId}/subjects/${subjectId}/exams`, data);
export const updateExam = (id, data) => API.put(`/exams/${id}`, data);
export const deleteExam = (id) => API.delete(`/exams/${id}`);

// ── Results ───────────────────────────────────────────────────────────────────
export const getResults = (examId) => API.get(`/results/exams/${examId}`);
export const saveResults = (examId, data) => API.post(`/results/exams/${examId}`, data);
export const releaseResults = (examId) => API.post(`/results/exams/${examId}/release`);
export const getResultSummary = (examId) => API.get(`/results/exams/${examId}/summary`);
export const getResultDistribution = (examId) => API.get(`/results/exams/${examId}/distribution`);

// ── Past Papers ───────────────────────────────────────────────────────────────
export const getPastPapers = (examId) => API.get(`/past-papers/exams/${examId}`);
export const createPastPaper = (examId, data) =>
    API.post(`/past-papers/exams/${examId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updatePastPaper = (id, data) =>
    API.put(`/past-papers/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deletePastPaper = (id) => API.delete(`/past-papers/${id}`);

// ── Site Settings ─────────────────────────────────────────────────────────────
export const getSiteSettings = () => API.get('/site-settings');
export const updateSiteSettings = (data) => API.put('/site-settings', data);
export const uploadSiteMedia = (formData) =>
    API.post('/site-settings/upload-media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const createSection = (data) => API.post('/site-settings/sections', data);
export const updateSection = (id, data) => API.put(`/site-settings/sections/${id}`, data);
export const deleteSection = (id) => API.delete(`/site-settings/sections/${id}`);

// ── Admins ────────────────────────────────────────────────────────────────────
export const getAdmins = () => API.get('/admins');
export const createAdmin = (data) => API.post('/admins', data);
export const updateAdmin = (id, data) => API.put(`/admins/${id}`, data);
export const deleteAdmin = (id) => API.delete(`/admins/${id}`);
export const changePassword = (id, data) => API.put(`/admins/${id}/change-password`, data);

export default API;
