const Transaction = require('../models/transactionModel');

const transactionController = {
  
  createTransaction: async (req, res) => {
    try {
      const { amount, desc, type, category, date } = req.body;
      const userId = req.user.id;
      
      if (!amount || !desc || !type || !category || !date) {
        return res.status(400).json({
          success: false,
          message: 'All fields (amount, desc, type, category, date) are required'
        });
      }
      
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "income" or "expense"'
        });
      }
      
      const transactionId = await Transaction.create({
        amount: parseFloat(amount),
        description: desc,
        type,
        category,
        user_id: userId,
        transaction_date: date
      });
      
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: { id: transactionId }
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        error: error.message
      });
    }
  },

  getTransactions: async (req, res) => {
    try {
      const userId = req.user.id;
      const transactions = await Transaction.getAll(userId);
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message
      });
    }
  },

  getTransactionsByMonth: async (req, res) => {
    try {
      const { month, year } = req.params;
      const userId = req.user.id;
      const transactions = await Transaction.getByMonth(userId, parseInt(month), parseInt(year));
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Get transactions by month error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message
      });
    }
  },

  getTransactionById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const transaction = await Transaction.getById(parseInt(id), userId);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction',
        error: error.message
      });
    }
  },

  deleteTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const deleted = await Transaction.delete(parseInt(id), userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
        error: error.message
      });
    }
  },

  updateTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, desc, type, category, date } = req.body;
      const userId = req.user.id;
      
      if (!amount || !desc || !type || !category || !date) {
        return res.status(400).json({
          success: false,
          message: 'All fields (amount, desc, type, category, date) are required'
        });
      }
      
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "income" or "expense"'
        });
      }
      
      const updated = await Transaction.update(parseInt(id), {
        amount: parseFloat(amount),
        description: desc,
        type,
        category,
        transaction_date: date
      }, userId);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Transaction updated successfully'
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        error: error.message
      });
    }
  }
};

module.exports = transactionController;