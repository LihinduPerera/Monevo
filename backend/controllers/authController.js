const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

const authController = {
  
  register: async (req, res) => {
    try {
      const { name, email, password, date_of_birth } = req.body;
      
      
      if (!name || !email || !password || !date_of_birth) {
        return res.status(400).json({
          success: false,
          message: 'All fields (name, email, password, date_of_birth) are required'
        });
      }
      
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      
      
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const userId = await User.create({
        name,
        email,
        password,
        date_of_birth
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { id: userId }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: error.message
      });
    }
  },

  
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      
      const user = await User.getByEmail(email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }
      
      
      const isPasswordValid = await User.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      
      await User.updateLastLogin(user.id);
      
      
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token,
          expiresIn: JWT_EXPIRES_IN
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: error.message
      });
    }
  },


  getProfile: async (req, res) => {
    try {

      const { password: _, ...userWithoutPassword } = req.user;
      
      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      // This would require additional implementation in User model
      // For now, just return not implemented
      res.status(501).json({
        success: false,
        message: 'Profile update not implemented yet'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
};

module.exports = authController;