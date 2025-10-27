const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/goals', authenticateToken, goalController.createGoal);
router.get('/goals', authenticateToken, goalController.getGoals);
router.get('/goals/:month/:year', authenticateToken, goalController.getGoalByMonth);
router.put('/goals/:id', authenticateToken, goalController.updateGoal);
router.delete('/goals/:id', authenticateToken, goalController.deleteGoal);

module.exports = router;