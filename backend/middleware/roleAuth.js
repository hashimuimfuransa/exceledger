const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('=== ROLE AUTH DEBUG ===');
    console.log('allowedRoles:', allowedRoles);
    console.log('req.user:', req.user);
    console.log('req.user.role:', req.user?.role);
    
    if (!req.user) {
      console.log('No req.user found');
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Normalize the role to handle any potential whitespace issues
    const userRole = req.user.role ? req.user.role.toString().trim() : '';
    console.log('normalized userRole:', userRole);
    console.log('allowedRoles includes userRole:', allowedRoles.includes(userRole));
    
    if (!allowedRoles.includes(userRole)) {
      console.log('ACCESS DENIED');
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    console.log('ACCESS GRANTED');
    console.log('======================');
    next();
  };
};

module.exports = roleAuth;
