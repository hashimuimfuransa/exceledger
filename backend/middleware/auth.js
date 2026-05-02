const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Authentication required.' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found. Authentication failed.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'User account is inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token. Authentication failed.' });
  }
};

module.exports = auth;
