const Goal = require('../models/goalModel');

const goalController = {
  
  createGoal: async (req, res) => {
    try {
      const { target_amount, target_month, target_year } = req.body;
      const userId = req.user.id;
      
      if (!target_amount || !target_month || !target_year) {
        return res.status(400).json({
          success: false,
          message: 'All fields (target_amount, target_month, target_year) are required'
        });
      }
      
      if (target_month < 1 || target_month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Month must be between 1 and 12'
        });
      }

      const goalId = await Goal.create({
        target_amount: parseFloat(target_amount),
        target_month: parseInt(target_month),
        target_year: parseInt(target_year),
        user_id: userId
      });
      
      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: { id: goalId }
      });
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create goal',
        error: error.message
      });
    }
  },

  getGoals: async (req, res) => {
    try {
      const userId = req.user.id;
      const goals = await Goal.getUserGoals(userId);
      
      res.json({
        success: true,
        data: goals
      });
    } catch (error) {
      console.error('Get goals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch goals',
        error: error.message
      });
    }
  },

  getGoalByMonth: async (req, res) => {
    try {
      const { month, year } = req.params;
      const userId = req.user.id;
      const goal = await Goal.getByUserAndMonth(userId, parseInt(month), parseInt(year));
      
      res.json({
        success: true,
        data: goal
      });
    } catch (error) {
      console.error('Get goal by month error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch goal',
        error: error.message
      });
    }
  },

  updateGoal: async (req, res) => {
    try {
      const { id } = req.params;
      const { target_amount, target_month, target_year } = req.body;
      const userId = req.user.id;
      
      if (!target_amount || !target_month || !target_year) {
        return res.status(400).json({
          success: false,
          message: 'All fields (target_amount, target_month, target_year) are required'
        });
      }
      
      if (target_month < 1 || target_month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Month must be between 1 and 12'
        });
      }
      
      const updated = await Goal.update(parseInt(id), {
        target_amount: parseFloat(target_amount),
        target_month: parseInt(target_month),
        target_year: parseInt(target_year)
      }, userId);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Goal updated successfully'
      });
    } catch (error) {
      console.error('Update goal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update goal',
        error: error.message
      });
    }
  },

  deleteGoal: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const deleted = await Goal.delete(parseInt(id), userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Goal deleted successfully'
      });
    } catch (error) {
      console.error('Delete goal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete goal',
        error: error.message
      });
    }
  }
};

module.exports = goalController;