const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getAllBatches, createBatch, updateBatch, deleteBatch } = require('../controllers/batchController');
const { getStudentsByBatch, createStudent } = require('../controllers/studentController');
const { getExamsByBatchAndSubject, createExam } = require('../controllers/examController');

router.get('/', getAllBatches);                                // public
router.post('/', auth, createBatch);
router.put('/:id', auth, updateBatch);
router.delete('/:id', auth, deleteBatch);

router.get('/:batchId/students', auth, getStudentsByBatch);
router.post('/:batchId/students', auth, createStudent);

router.get('/:batchId/subjects/:subjectId/exams', getExamsByBatchAndSubject);  // public
router.post('/:batchId/subjects/:subjectId/exams', auth, createExam);

module.exports = router;
