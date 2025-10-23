# Water Tools Backend API

A Node.js backend API with Express.js framework featuring user authentication and authorization.

## Project Structure

```
water-tools-backend/
├── models/
│   └── User.js                 # User model with Mongoose schema
├── middleware/
│   └── auth.js                 # JWT authentication middleware
├── routes/
│   └── auth.js                 # Authentication routes
├── app.js                      # Main application file
├── package.json                # Project dependencies and scripts
└── README.md                   # This file
```

## Features

- **Express.js** web framework
- **MongoDB** database with Mongoose ODM
- **JWT Authentication** with secure token handling
- **Password Hashing** with bcryptjs
- **Security** middleware (Helmet, CORS)
- **Request logging** with Morgan
- **Input validation** and error handling
- **User roles** (user, admin)

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=*
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/water-tools
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   ```

4. Make sure MongoDB is running on your system

## Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- **Description**: Register a new user
- **Access**: Public
- **Body**:
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "_id": "...",
        "username": "johndoe",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      },
      "token": "jwt-token-here"
    }
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Description**: Login user and get JWT token
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "...",
        "username": "johndoe",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "isActive": true,
        "lastLogin": "...",
        "createdAt": "...",
        "updatedAt": "..."
      },
      "token": "jwt-token-here"
    }
  }
  ```

#### Get Current User Profile
- **GET** `/api/auth/me`
- **Description**: Get current user profile
- **Access**: Private (requires JWT token)
- **Headers**: `Authorization: Bearer <jwt-token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "...",
        "username": "johndoe",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "isActive": true,
        "lastLogin": "...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    }
  }
  ```

#### Update User Profile
- **PUT** `/api/auth/profile`
- **Description**: Update user profile
- **Access**: Private (requires JWT token)
- **Headers**: `Authorization: Bearer <jwt-token>`
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Smith",
    "username": "johnsmith"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "user": {
        "_id": "...",
        "username": "johnsmith",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Smith",
        "role": "user",
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    }
  }
  ```

#### Logout User
- **POST** `/api/auth/logout`
- **Description**: Logout user (client-side token removal)
- **Access**: Private (requires JWT token)
- **Headers**: `Authorization: Bearer <jwt-token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

### General Endpoints

#### Root Endpoint
- **GET** `/`
- **Description**: Welcome message with API information
- **Access**: Public
- **Response**:
  ```json
  {
    "success": true,
    "message": "Welcome to Water Tools Backend API",
    "version": "1.0.0",
    "endpoints": {
      "auth": {
        "register": "POST /api/auth/register",
        "login": "POST /api/auth/login",
        "profile": "GET /api/auth/me",
        "updateProfile": "PUT /api/auth/profile",
        "logout": "POST /api/auth/logout"
      }
    }
  }
  ```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Additional error details"] // Optional
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB object modeling
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token handling
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **dotenv**: Environment variables
- **nodemon**: Development auto-restart (dev dependency)

## Testing the API

You can test the API using tools like:
- **Postman**
- **curl**
- **Thunder Client** (VS Code extension)
- **Insomnia**

### Example curl commands:

#### Register a user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Get profile (replace TOKEN with actual token):
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Security Features

- Password hashing with bcryptjs (salt rounds: 12)
- JWT token expiration (configurable, default: 7 days)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Account deactivation support
- Role-based access control

## Next Steps

This project provides a solid foundation for a Node.js/Express.js application with authentication. You can extend it by:

1. **Adding more user roles** and permissions
2. **Password reset** functionality
3. **Email verification** for new accounts
4. **Rate limiting** for API endpoints
5. **API documentation** with Swagger/OpenAPI
6. **Unit and integration tests**
7. **Docker configuration** for deployment
8. **Additional business logic** for water tools features

## License

ISC# water-tool-backend
