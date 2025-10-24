# Water Tools Backend API

A complete authentication system for water management tools with registration and login functionality.

## 🚀 Features

- **User Registration** - Create new user accounts
- **User Login** - Secure authentication with JWT tokens
- **Profile Management** - View and update user profiles
- **Password Security** - Bcrypt hashing for secure password storage
- **JWT Authentication** - Secure token-based authentication
- **MongoDB Integration** - Persistent data storage
- **CORS Support** - Cross-origin resource sharing for frontend integration

## 📋 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/me` | Get current user profile | Private |
| PUT | `/profile` | Update user profile | Private |
| POST | `/logout` | Logout user | Private |

## 🔧 Installation & Setup

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd water-tools-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB:**
   ```bash
   sudo systemctl start mongodb
   ```

5. **Run the application:**
```bash
npm run dev
```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Hostinger VPS deployment guide.

## 📝 API Usage Examples

### User Registration

```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data);
```

### User Login

```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.data.token;
```

### Get User Profile

```javascript
const response = await fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data.user);
```

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **PM2** - Process management (production)
- **Nginx** - Reverse proxy (production)

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Input validation
- Error handling
- Helmet security headers

## 📊 Project Structure

```
water-tools-backend/
├── app.js                 # Main application file
├── package.json          # Dependencies and scripts
├── ecosystem.config.js   # PM2 configuration
├── deploy.sh            # Deployment script
├── DEPLOYMENT.md        # Deployment guide
├── controllers/         # Route controllers
│   └── authController.js
├── middleware/          # Custom middleware
│   └── auth.js
├── models/             # Database models
│   └── User.js
├── routes/             # API routes
│   └── auth.js
└── logs/               # Application logs
```

## 🧪 Testing

Run the test script to verify all endpoints:

```bash
node test-api.js
```

## 🌐 Frontend Integration

This backend is designed to work with any frontend framework (React, Vue, Angular, etc.). Simply make HTTP requests to the API endpoints using your preferred HTTP client (fetch, axios, etc.).

### CORS Configuration

The API is configured to accept requests from your frontend domain. Update the `CORS_ORIGIN` environment variable with your frontend URL.

## 📞 Support

For deployment assistance or questions, refer to the [DEPLOYMENT.md](./DEPLOYMENT.md) guide or check the troubleshooting section.

---

**Ready for production deployment on Hostinger VPS!** 🚀