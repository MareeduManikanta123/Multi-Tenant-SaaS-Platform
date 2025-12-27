const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-minimum-32-characters-long-for-security';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
function generateToken(userId, tenantId, role) {
  return jwt.sign(
    {
      userId,
      tenantId,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get token expiry in seconds
function getTokenExpiry() {
  return 86400; // 24 hours
}

module.exports = {
  generateToken,
  verifyToken,
  getTokenExpiry,
};
