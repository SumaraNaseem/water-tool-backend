const express = require('express');
const { authenticateToken, verifyRefreshToken } = require('../middleware/auth');
const {
  validateRegistrationInput,
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  logoutUser,
  refreshToken
} = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user for water management system
// @access  Public
router.post('/register', validateRegistrationInput, registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, getCurrentUser);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, updateProfile);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, logoutUser);

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh', verifyRefreshToken, refreshToken);

module.exports = router;
