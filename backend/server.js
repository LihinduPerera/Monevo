require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, closeConnection } = require('./config/database');
const transactionRoutes = require('./routes/transactionRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', transactionRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Finance API is running', 
    timestamp: new Date().toISOString() 
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Finance API Server', 
    endpoints: {
      health: '/health',
      transactions: '/api/transactions'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler - FIXED: Remove the '*' parameter
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

startServer();