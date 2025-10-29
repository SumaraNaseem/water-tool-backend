const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

class Database {
  static readUsers() {
    try {
      const data = fs.readFileSync(usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  static writeUsers(users) {
    try {
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing users:', error);
      return false;
    }
  }

  static async findUserByEmail(email) {
    const users = this.readUsers();
    return users.find(user => user.email === email);
  }

  static async findUserById(id) {
    const users = this.readUsers();
    return users.find(user => user.id === id);
  }

  static async createUser(userData) {
    const users = this.readUsers();
    
    // Check if user already exists
    if (await this.findUserByEmail(userData.email)) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    
    if (this.writeUsers(users)) {
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };
    } else {
      throw new Error('Failed to save user');
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(userId) {
    const users = this.readUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      users[userIndex].updatedAt = new Date().toISOString();
      this.writeUsers(users);
    }
  }

  static async updateUser(userId, updateData) {
    const users = this.readUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      if (this.writeUsers(users)) {
        return {
          id: users[userIndex].id,
          name: users[userIndex].name,
          email: users[userIndex].email,
          role: users[userIndex].role,
          createdAt: users[userIndex].createdAt,
          updatedAt: users[userIndex].updatedAt
        };
      }
    }
    
    throw new Error('User not found or update failed');
  }
}

module.exports = Database;