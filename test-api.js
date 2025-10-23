#!/usr/bin/env node

/**
 * Simple test script for Water Tools Backend API
 * This script demonstrates the authentication functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

async function testAPI() {
  console.log('🧪 Testing Water Tools Backend API\n');

  try {
    // Test 1: Root endpoint
    console.log('1. Testing root endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Root endpoint:', rootResponse.data.message);
    console.log('');

    // Test 2: Register user
    console.log('2. Testing user registration...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      console.log('✅ User registered successfully');
      console.log('   User ID:', registerResponse.data.data.user._id);
      console.log('   Username:', registerResponse.data.data.user.username);
      authToken = registerResponse.data.data.token;
      console.log('   Token received:', authToken ? 'Yes' : 'No');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️  User already exists, proceeding with login...');
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 3: Login user
    console.log('3. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ User logged in successfully');
    console.log('   User ID:', loginResponse.data.data.user._id);
    console.log('   Last login:', loginResponse.data.data.user.lastLogin);
    authToken = loginResponse.data.data.token;
    console.log('   Token received:', authToken ? 'Yes' : 'No');
    console.log('');

    // Test 4: Get user profile
    console.log('4. Testing get user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Profile retrieved successfully');
    console.log('   Username:', profileResponse.data.data.user.username);
    console.log('   Email:', profileResponse.data.data.user.email);
    console.log('   Role:', profileResponse.data.data.user.role);
    console.log('');

    // Test 5: Update user profile
    console.log('5. Testing profile update...');
    const updateResponse = await axios.put(`${BASE_URL}/api/auth/profile`, {
      firstName: 'Updated',
      lastName: 'Name'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Profile updated successfully');
    console.log('   New name:', `${updateResponse.data.data.user.firstName} ${updateResponse.data.data.user.lastName}`);
    console.log('');

    // Test 6: Logout
    console.log('6. Testing logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Logout successful');
    console.log('   Message:', logoutResponse.data.message);
    console.log('');

    console.log('🎉 All tests passed successfully!');
    console.log('\n📋 API Summary:');
    console.log('   - User registration: ✅');
    console.log('   - User login: ✅');
    console.log('   - Profile retrieval: ✅');
    console.log('   - Profile update: ✅');
    console.log('   - User logout: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Check if axios is available
try {
  require.resolve('axios');
  testAPI();
} catch (error) {
  console.log('📦 Installing axios for testing...');
  const { execSync } = require('child_process');
  execSync('npm install axios', { stdio: 'inherit' });
  console.log('✅ Axios installed, running tests...');
  testAPI();
}
