const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const authRoutes = require('./routes/auth');

// Connect to MongoDB (optimized for serverless/Vercel)
let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection if available (for serverless)
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/water-tools';
    
    // MongoDB connection options optimized for serverless
    const options = {
      maxPoolSize: 1, // Maintain a single connection pool for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
    };

    cachedConnection = await mongoose.connect(mongoURI, options);
    console.log('✅ Connected to MongoDB');
    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    cachedConnection = null; // Reset cache on error
    
    // Don't exit process on Vercel, just log the error
    if (process.env.NODE_ENV !== 'production') {
      console.log('💡 Make sure MongoDB is running on your system');
      console.log('   You can start MongoDB with: sudo systemctl start mongod');
      console.log('   Or install MongoDB if not installed');
      process.exit(1);
    }
    throw error;
  }
};

// Connect to database (only if not on Vercel serverless)
// On Vercel, connection happens on first request via lazy loading
if (require.main === module) {
  connectDB();
}

// Ensure database connection before handling requests (for serverless)
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (error) {
    console.error('Database connection failed:', error);
  }
  next();
});

// Security middleware
app.use(helmet());

// CORS middleware - More permissive for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Additional CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  next();
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.status(200).end();
});

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Water Tools Backend API',
    version: '1.0.0',
    database: 'MongoDB',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not Set',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not Set',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'Set' : 'Not Set',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'Not Set'
    },
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
        logout: 'POST /api/auth/logout'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Export for Vercel
module.exports = app;

// Start server locally (for development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Server available at http://localhost:${PORT}`);
  });
}
