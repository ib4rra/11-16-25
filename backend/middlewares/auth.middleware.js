const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).send({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(401).send({ message: 'Invalid or expired token' });
    req.userId = decoded.id;
    req.userRoleId = decoded.role_id;
    // Ensure backward compatibility for handlers expecting req.user.id
    req.user = {
      id: decoded.id,
      roleId: decoded.role_id,
    };
    next();
  });
};

exports.authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRoleId)) {
      return res.status(403).send({ message: 'Access denied: insufficient role' });
    }
    next();
  };
};
