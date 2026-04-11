const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getAllAdmins, createAdmin, updateAdmin, deleteAdmin, changePassword
} = require('../controllers/adminController');

router.get('/', auth, getAllAdmins);
router.post('/', auth, createAdmin);
router.put('/:id', auth, updateAdmin);
router.delete('/:id', auth, deleteAdmin);
router.put('/:id/change-password', auth, changePassword);

module.exports = router;
