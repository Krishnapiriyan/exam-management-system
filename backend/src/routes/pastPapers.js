const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getPastPapersByExam, createPastPaper, updatePastPaper, deletePastPaper, upload
} = require('../controllers/pastPaperController');

const uploadFields = upload.fields([
    { name: 'questionPaper', maxCount: 1 },
    { name: 'markingScheme', maxCount: 1 },
    { name: 'marksSheet', maxCount: 1 },
]);

router.get('/exams/:examId', getPastPapersByExam);                                // public
router.post('/exams/:examId', auth, uploadFields, createPastPaper);
router.put('/:id', auth, uploadFields, updatePastPaper);
router.delete('/:id', auth, deletePastPaper);

module.exports = router;
