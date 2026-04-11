const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getGlobalStats, getBatchStats } = require('../controllers/dashboardController');

router.get('/stats', auth, getGlobalStats);
router.get('/batch/:batchId/stats', auth, getBatchStats);

module.exports = router;
