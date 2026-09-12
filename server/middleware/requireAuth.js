const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;
const authCookieName = 'vogue_session';

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

const requireAuth = (req, res, next) => {
  const authorization = req.get('Authorization') || '';
  const token = req.cookies?.[authCookieName]
    || (authorization.startsWith('Bearer ') ? authorization.slice(7) : '');

  if (!token) return res.status(401).json({ error: 'Authentication is required.' });

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
};

module.exports = { authCookieName, jwtSecret, requireAuth };