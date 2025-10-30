const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');

// Input validation helper
const validateRegistrationInput = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  
  // Only validate the 3 required fields from frontend
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
      errors: ['Fullständigt namn, e-postadress och lösenord är obligatoriska']
    });
  }

  // If confirmPassword is provided, check if it matches
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
      errors: ['Lösenorden matchar inte']
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
      errors: ['Lösenordet måste vara minst 6 tecken långt']
    });
  }

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email',
      errors: ['Ange en giltig e-postadress']
    });
  }

  next();
};

// @desc    Register a new user for water management system
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Split full name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Generate username from email (before @)
    const username = email.split('@')[0];

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
        errors: [existingUser.email === email ? 'E-postadressen finns redan' : 'Användarnamnet finns redan']
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'user' // Default role for water management users
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token to user
    await user.addRefreshToken(refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      message_sv: 'Användare registrerad framgångsrikt',
      data: {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        message_sv: 'Valideringsfel',
        errors
      });
    }

    // Include error details in development
    const errorResponse = {
      success: false,
      message: 'Internal server error',
      message_sv: 'Internt serverfel'
    };

    // Add error details in non-production or if it's a MongoDB/JWT error
    if (process.env.NODE_ENV !== 'production' || error.name === 'MongoServerError' || error.name === 'MongoError' || error.message?.includes('JWT')) {
      errorResponse.error = error.message;
      errorResponse.errorName = error.name;
    }

    res.status(500).json(errorResponse);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        message_sv: 'E-postadress och lösenord krävs'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        message_sv: 'Ogiltig e-postadress eller lösenord'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        message_sv: 'Kontot är inaktiverat'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        message_sv: 'Ogiltig e-postadress eller lösenord'
      });
    }
console.log('Login successful');
    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token to user
    await user.addRefreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      message_sv: 'Inloggning lyckades',
      data: {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          username: user.username,
          role: user.role,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      message_sv: 'Internt serverfel'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`.trim(),
          email: req.user.email,
          username: req.user.username,
          role: req.user.role,
          lastLogin: req.user.lastLogin,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      message_sv: 'Internt serverfel'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    // Split full name if provided
    let firstName = req.user.firstName;
    let lastName = req.user.lastName;
    
    if (name) {
      const nameParts = name.trim().split(' ');
      firstName = nameParts[0] || req.user.firstName;
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
          message_sv: 'E-postadressen finns redan'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        firstName, 
        lastName, 
        email: email || req.user.email 
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      message_sv: 'Profil uppdaterad framgångsrikt',
      data: {
        user: {
          id: updatedUser._id,
          name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          lastLogin: updatedUser.lastLogin,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        message_sv: 'Valideringsfel',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      message_sv: 'Internt serverfel'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Remove specific refresh token
      await req.user.removeRefreshToken(refreshToken);
    } else {
      // Remove all refresh tokens
      await req.user.removeAllRefreshTokens();
    }

    res.json({
      success: true,
      message: 'Logout successful',
      message_sv: 'Utloggning lyckades'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      message_sv: 'Internt serverfel'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      message_sv: 'Token uppdaterad framgångsrikt',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      message_sv: 'Internt serverfel'
    });
  }
};

module.exports = {
  validateRegistrationInput,
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  logoutUser,
  refreshToken
};
