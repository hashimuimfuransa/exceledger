const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token found:', !!token);

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided. Authentication required.' });
    }

    const decoded = verifyToken(token);
    console.log('Token decoded:', decoded);
    
    const user = await User.findById(decoded.userId);
    console.log('User found:', !!user);

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'User not found. Authentication failed.' });
    }

    if (!user.isActive) {
      console.log('User account is inactive');
      return res.status(401).json({ message: 'User account is inactive.' });
    }

    console.log('User role from DB:', user.role);
    req.user = user;
    console.log('req.user set successfully');
    console.log('============================');
    next();
  } catch (error) {
    console.log('Auth error:', error.message);
    return res.status(401).json({ message: 'Invalid token. Authentication failed.' });
  }
};

module.exports = auth;
