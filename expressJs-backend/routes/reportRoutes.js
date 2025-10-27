const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/report', authenticateToken, reportController.generateReport);
router.get('/report/yearly', authenticateToken, reportController.getYearlyReport);

module.exports = router;