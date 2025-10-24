const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    this.usersFile = path.join(__dirname, 'users.json');
    this.loadUsers();
  }

  loadUsers() {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      this.users = JSON.parse(data).users || [];
    } catch (error) {
      this.users = [];
      this.saveUsers();
    }
  }

  saveUsers() {
    fs.writeFileSync(this.usersFile, JSON.stringify({ users: this.users }, null, 2));
  }

  findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  async createUser(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const user = {
      id: Date.now().toString(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
      role: 'user'
    };
    
    this.users.push(user);
    this.saveUsers();
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id, updateData) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      // If password is being updated, hash it
      if (updateData.password) {
        const salt = await bcrypt.genSalt(12);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }
      
      this.users[userIndex] = { ...this.users[userIndex], ...updateData };
      this.saveUsers();
      
      // Return user without password
      const { password, ...userWithoutPassword } = this.users[userIndex];
      return userWithoutPassword;
    }
    return null;
  }

  async comparePassword(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) return false;
    
    // Find user with password from database
    const userWithPassword = this.users.find(u => u.id === user.id);
    if (!userWithPassword) return false;
    
    return await bcrypt.compare(password, userWithPassword.password);
  }

  async updateLastLogin(id) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex].lastLogin = new Date().toISOString();
      this.saveUsers();
      return this.users[userIndex];
    }
    return null;
  }
}

module.exports = new Database();
