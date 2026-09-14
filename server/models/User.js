const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: false, select: false },
  googleId: { type: String, unique: true, sparse: true, select: false },
  profile: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ onboardingComplete: false }),
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);