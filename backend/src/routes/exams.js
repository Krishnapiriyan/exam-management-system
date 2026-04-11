const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getAllExams, getExamById, updateExam, deleteExam } = require('../controllers/examController');

router.get('/', getAllExams);                      // public — for calendar
router.get('/:id', getExamById);                  // public
router.put('/:id', auth, updateExam);
router.delete('/:id', auth, deleteExam);

module.exports = router;
