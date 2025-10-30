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
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('Attempting MongoDB connection...');
    console.log('MongoDB URI present:', mongoURI ? 'Yes (hidden)' : 'No');
    
    // MongoDB connection options optimized for serverless/Vercel
    const options = {
      maxPoolSize: 1, // Maintain a single connection pool for serverless
      serverSelectionTimeoutMS: 10000, // Increased timeout for Vercel
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      // Retry connection settings
      retryWrites: true,
      w: 'majority',
    };

    cachedConnection = await mongoose.connect(mongoURI, options);
    console.log('✅ Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db?.databaseName);
    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
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

// CORS middleware - MUST be before other middleware to handle preflight requests
const explicitAllowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://water-tool-frontend.vercel.app',
  'https://water-tool-frontend-atgm.vercel.app',


].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin)
    if (!origin) return callback(null, true);

    // Allow any Vercel frontend subdomain and explicit allowlist
    const isVercel = /\.vercel\.app$/i.test(origin);
    if (isVercel || explicitAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Handle preflight OPTIONS requests BEFORE database connection
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.status(200).end();
});

// Security middleware
app.use(helmet());

// Additional CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  next();
});

// Ensure database connection before handling API requests (skip for OPTIONS)
app.use(async (req, res, next) => {
  // Skip database connection for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  // Only connect for API routes that need database
  if (req.path.startsWith('/api/')) {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.log('Database not connected, attempting connection...');
        await connectDB();
        console.log('Database connection established');
      }
    } catch (error) {
      console.error('Database connection failed:', error);
      console.error('MongoDB URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      
      // Return detailed error for debugging
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message || 'Unknown database error',
        errorName: error.name || 'DatabaseError',
        errorCode: error.code,
        // Include helpful hints
        hint: !process.env.MONGODB_URI 
          ? 'MONGODB_URI environment variable is not set'
          : error.message?.includes('authentication') 
            ? 'Check MongoDB Atlas credentials and user permissions'
            : error.message?.includes('ENOTFOUND') || error.message?.includes('DNS')
              ? 'Check MongoDB Atlas network access - Vercel IPs might not be allowed'
              : 'Check MongoDB Atlas connection string and cluster status'
      });
    }
  }
  next();
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
console.log('Auth routes loaded');

// Test MongoDB connection endpoint (for debugging)
app.get('/api/test-db', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      console.log('Attempting to connect...');
      await connectDB();
    }
    
    // Try a simple operation
    const User = require('./models/User');
    const count = await User.countDocuments();
    
    res.json({
      success: true,
      message: 'Database connection successful',
      connectionState: mongoose.connection.readyState,
      connectionStateName: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      }[mongoose.connection.readyState],
      userCount: count,
      database: mongoose.connection.db?.databaseName,
      mongoDBUri: process.env.MONGODB_URI ? 'Set' : 'Not Set'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection test failed',
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      mongoDBUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
      hint: !process.env.MONGODB_URI 
        ? 'MONGODB_URI environment variable is not set in Vercel'
        : error.message?.includes('authentication') 
          ? 'Check MongoDB Atlas username and password in connection string'
          : error.message?.includes('ENOTFOUND') || error.message?.includes('DNS')
            ? 'Check MongoDB Atlas Network Access - allow Vercel IPs (0.0.0.0/0)'
            : 'Check MongoDB Atlas connection string format and cluster status'
    });
  }
});

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
