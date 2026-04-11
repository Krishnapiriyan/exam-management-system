const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getResultsByExam, saveResults, releaseResults, getResultSummary, getResultDistribution
} = require('../controllers/resultController');

router.get('/exams/:examId', auth, getResultsByExam);
router.post('/exams/:examId', auth, saveResults);
router.post('/exams/:examId/release', auth, releaseResults);
router.get('/exams/:examId/summary', auth, getResultSummary);
router.get('/exams/:examId/distribution', getResultDistribution);  // public (for user charts)

module.exports = router;
