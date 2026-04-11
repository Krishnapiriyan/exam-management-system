import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

export const getSiteSettings = () => API.get('/site-settings');
export const getAllExams = () => API.get('/exams');
export const getBatches = () => API.get('/batches');
export const getSubjects = () => API.get('/subjects');

export const getExamsByBatchSubject = (batchId, subjectId) =>
    API.get(`/batches/${batchId}/subjects/${subjectId}/exams`);

export const verifyStudent = (data) => API.post('/students/verify', data);
export const getStudentResults = (id) => API.get(`/students/${id}/results`);

export const getPastPapers = (examId) => API.get(`/past-papers/exams/${examId}`);
export const getResultDistribution = (examId) => API.get(`/results/exams/${examId}/distribution`);

export default API;
