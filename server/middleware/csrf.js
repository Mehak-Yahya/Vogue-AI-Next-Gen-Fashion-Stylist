const crypto = require('crypto');

const csrfCookieName = 'vogue_csrf';
const csrfHeaderName = 'x-csrf-token';
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const exemptPaths = new Set(['/auth/login', '/auth/signup', '/auth/google', '/auth/forgot-password', '/auth/verify-reset-otp', '/auth/reset-password', '/auth/csrf-token', '/billing/webhook']);

const cookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const csrfProtection = (req, res, next) => {
  let token = req.cookies?.[csrfCookieName];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(csrfCookieName, token, cookieOptions);
  }
  req.csrfToken = () => token;

  if (safeMethods.has(req.method) || exemptPaths.has(req.path)) return next();

  const submittedToken = req.get(csrfHeaderName) || '';
  const matchingLength = submittedToken.length === token.length;
  const matchingValue = matchingLength && crypto.timingSafeEqual(
    Buffer.from(submittedToken),
    Buffer.from(token),
  );

  if (!matchingValue) return res.status(403).json({ error: 'A valid CSRF token is required.' });
  return next();
};

module.exports = { csrfCookieName, csrfProtection };
