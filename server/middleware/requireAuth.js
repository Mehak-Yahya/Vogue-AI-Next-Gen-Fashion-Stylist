const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'vogue-ai-development-secret';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}

const requireAuth = (req, res, next) => {
  const authorization = req.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) return res.status(401).json({ error: 'Authentication is required.' });

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
};

module.exports = { jwtSecret, requireAuth };