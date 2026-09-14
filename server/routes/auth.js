const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const { authCookieName, jwtSecret, requireAuth } = require('../middleware/requireAuth');

const router = express.Router();
const firebaseCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const firebaseConfigured = Boolean(
  firebaseCredentialsPath
  || (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && firebasePrivateKey),
);
if (firebaseConfigured && getApps().length === 0) {
  initializeApp({
    credential: firebaseCredentialsPath
      ? applicationDefault()
      : cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: firebasePrivateKey }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}
const firebaseAuth = firebaseConfigured ? getAuth() : null;
const databaseUnavailable = () => mongoose.connection.readyState !== 1;
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many signup or login attempts. Please try again later.' },
});
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post('/signup', authAttemptLimiter, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please provide a valid email address.' });
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(password)) {
    return res.status(400).json({ error: 'Password must be 8+ characters with uppercase, lowercase, and a number.' });
  }
  if (databaseUnavailable()) return res.status(503).json({ error: 'Signup storage is unavailable. Start MongoDB and try again.' });

  try {
    if (await User.findOne({ email }).lean()) return res.status(409).json({ error: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({ message: 'Account created successfully.', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' });
    console.error('Signup Error:', error.message);
    return res.status(500).json({ error: 'Unable to create your account.' });
  }
});

router.post('/login', authAttemptLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (databaseUnavailable()) {
    return res.status(503).json({ error: 'Login storage is unavailable. Start MongoDB and try again.' });
  }

  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = Boolean(user?.passwordHash) && await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d' });
    res.cookie(authCookieName, token, cookieOptions);

    return res.status(200).json({
      message: 'Logged in successfully.',
      csrfToken: req.csrfToken(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingComplete: Boolean(user.profile?.onboardingComplete),
        profile: user.profile || { onboardingComplete: false },
      },
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({ error: 'Unable to log in right now.' });
  }
});

router.post('/google', authAttemptLimiter, async (req, res) => {
  const token = String(req.body.token || '');
  if (!firebaseAuth) return res.status(503).json({ error: 'Firebase sign-in is not configured on the server.' });
  if (!token) return res.status(400).json({ error: 'A Google identity token is required.' });
  if (databaseUnavailable()) return res.status(503).json({ error: 'Login storage is unavailable. Start MongoDB and try again.' });

  try {
    const payload = await firebaseAuth.verifyIdToken(token);
    const email = String(payload.email || '').trim().toLowerCase();
    const googleId = String(payload.sub || '');
    const name = String(payload.name || email.split('@')[0] || 'Google user').trim();

    if (!email || !googleId || payload.email_verified !== true) {
      return res.status(401).json({ error: 'Google could not verify this account.' });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] }).select('+passwordHash +googleId');
    if (!user) {
      user = await User.create({ name: name.length >= 2 ? name : 'Google user', email, googleId });
    } else {
      user.googleId = googleId;
      if (!user.name && name.length >= 2) user.name = name;
      await user.save();
    }

    const sessionToken = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d' });
    res.cookie(authCookieName, sessionToken, cookieOptions);
    return res.status(200).json({
      message: 'Logged in with Google successfully.',
      csrfToken: req.csrfToken(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingComplete: Boolean(user.profile?.onboardingComplete),
        profile: user.profile || { onboardingComplete: false },
      },
    });
  } catch (error) {
    console.error('Google Login Error:', error.message);
    return res.status(401).json({ error: 'Unable to verify your Google account.' });
  }
});

router.get('/csrf-token', (req, res) => res.json({ csrfToken: req.csrfToken() }));

router.post('/logout', (req, res) => {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.json({ message: 'Logged out successfully.' });
});

router.get('/session', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'User account was not found.' });
    return res.json({
      csrfToken: req.csrfToken(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        onboardingComplete: Boolean(user.profile?.onboardingComplete),
        profile: user.profile || { onboardingComplete: false },
      },
    });
  } catch (error) {
    console.error('Session Error:', error.message);
    return res.status(500).json({ error: 'Unable to restore your session.' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const name = req.body.name === undefined ? undefined : String(req.body.name).trim();
  const profile = req.body.profile;

  if (name !== undefined && (name.length < 2 || name.length > 100)) {
    return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
  }
  if (!userId || !profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return res.status(400).json({ error: 'A valid user profile is required.' });
  }
  if (databaseUnavailable()) {
    return res.status(503).json({ error: 'Profile storage is unavailable. Start MongoDB and try again.' });
  }

  try {
    const updates = { $set: { profile: { ...profile, onboardingComplete: true } } };
    if (name !== undefined) updates.$set.name = name;
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true },
    );

    if (!user) return res.status(404).json({ error: 'User account was not found.' });

    return res.status(200).json({
      message: 'Your style profile is ready.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingComplete: true,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error('Profile Error:', error.message);
    return res.status(500).json({ error: 'Unable to save your style profile.' });
  }
});

router.put('/password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(newPassword)) {
    return res.status(400).json({ error: 'New password must be 8+ characters with uppercase, lowercase, and a number.' });
  }

  if (databaseUnavailable()) {
    return res.status(503).json({ error: 'Password storage is unavailable. Start MongoDB and try again.' });
  }

  try {
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password Update Error:', error.message);
    return res.status(500).json({ error: 'Unable to update your password.' });
  }
});

module.exports = router;