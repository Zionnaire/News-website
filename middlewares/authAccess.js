// Middleware to check if the user is an Admin
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'Admin') {
      next(); // User is an Admin, proceed to the next middleware or route handler
    } else {
      res.status(403).json({ message: 'Unauthorized access' });
    }
  }
  
  // Middleware to check if the user is a SuperAdmin
  function isSuperAdmin(req, res, next) {
    if (req.user && req.user.role === 'SuperAdmin') {
      next(); // User is a SuperAdmin, proceed to the next middleware or route handler
    } else {
      res.status(403).json({ message: 'Unauthorized access' });
    }
  }

  module.exports = {
    isSuperAdmin,
    isAdmin,
  };
  