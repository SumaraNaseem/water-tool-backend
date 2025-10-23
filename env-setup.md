# Environment Configuration for Water Tools Backend

Create a `.env` file in your project root with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/water-tools

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
```

## Important Notes:
1. Change the `JWT_SECRET` to a strong, unique secret key in production
2. Update `CORS_ORIGIN` to match your frontend URL
3. Make sure MongoDB is running on your system
4. The `.env` file should be added to `.gitignore` for security

