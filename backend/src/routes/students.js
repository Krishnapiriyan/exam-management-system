const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getStudentById, updateStudent, deleteStudent, verifyStudent, getStudentResults
} = require('../controllers/studentController');

router.post('/verify', verifyStudent);                   // public
router.get('/:id', auth, getStudentById);
router.put('/:id', auth, updateStudent);
router.delete('/:id', auth, deleteStudent);
router.get('/:id/results', getStudentResults);           // public if verified upstream

module.exports = router;
