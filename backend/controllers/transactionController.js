const Transaction = require('../models/transactionModel');

const transactionController = {
  // Create new transaction
  createTransaction: async (req, res) => {
    try {
      const { amount, desc, type, category, date } = req.body;
      
      // Validate required fields
      if (!amount || !desc || !type || !category) {
        return res.status(400).json({
          success: false,
          message: 'All fields (amount, desc, type, category) are required'
        });
      }
      
      // Validate type
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
        category
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

  // Get all transactions
  getTransactions: async (req, res) => {
    try {
      const transactions = await Transaction.getAll();
      
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

  // Get transaction by ID
  getTransactionById: async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await Transaction.getById(parseInt(id));
      
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

  // Delete transaction
  deleteTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Transaction.delete(parseInt(id));
      
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

  // Update transaction
  updateTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, desc, type, category } = req.body;
      
      // Validate required fields
      if (!amount || !desc || !type || !category) {
        return res.status(400).json({
          success: false,
          message: 'All fields (amount, desc, type, category) are required'
        });
      }
      
      // Validate type
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
        category
      });
      
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