const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please provide a valid email address.' });
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(password)) {
    return res.status(400).json({ error: 'Password must be 8+ characters with uppercase, lowercase, and a number.' });
  }
  if (!process.env.MONGODB_URI) return res.status(503).json({ error: 'Signup storage is not configured. Set MONGODB_URI on the server.' });

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

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (!process.env.MONGODB_URI) {
    return res.status(503).json({ error: 'Login storage is not configured. Set MONGODB_URI on the server.' });
  }

  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    return res.status(200).json({
      message: 'Logged in successfully.',
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

router.put('/profile', async (req, res) => {
  const userId = String(req.body.userId || '').trim();
  const profile = req.body.profile;

  if (!userId || !profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return res.status(400).json({ error: 'A valid user profile is required.' });
  }
  if (!process.env.MONGODB_URI) {
    return res.status(503).json({ error: 'Profile storage is not configured.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profile: { ...profile, onboardingComplete: true } } },
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

module.exports = router;