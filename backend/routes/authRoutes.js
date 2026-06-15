
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import { registerUser, login, googleLogin, completeQuestionnaire } from "../controllers/authController.js";
import { sendPasswordResetEmail, sendPasswordResetCodeEmail } from "../utils/emailService.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/complete-questionnaire", completeQuestionnaire);
const resetCodes = {};

// Forgot Password (code-based)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      console.log("Forgot password failed: missing email");
      return res.status(400).json({ message: "Email is required!" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("Forgot password failed: user not found for " + email);
      return res.status(404).json({ message: "User not found!" });
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    resetCodes[user._id] = { code, expires: Date.now() + 15 * 60 * 1000 };

    try {
      const sendResult = await sendPasswordResetCodeEmail(email, code);

      console.log(`Password reset code sent to: ${email}`);

      const responsePayload = {
        message: "Password reset code has been sent to your email.",
        info: "Check your inbox and spam folder. Code expires in 15 minutes."
      };

      if (process.env.NODE_ENV === "test") {
        responsePayload.testCode = code;
      }

      res.status(200).json(responsePayload);
    } catch (emailError) {
      console.error("Code email sending failed: " + emailError);

      res.status(500).json({
        message: "Failed to send reset code email. Please try again later."
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset Password (code-based)
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    if (!email || !code || !newPassword) {
      console.log("Reset password failed: missing fields");
      return res.status(400).json({
        message: "Email, code, and new password are required!"
      });
    }

    if (newPassword.length < 6) {
      console.log("Reset password failed: password too short for " + email);
      return res.status(400).json({
        message: "Password must be at least 6 characters!"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log("Reset password failed: user not found for " + email);
      return res.status(404).json({ message: "User not found!" });
    }

    const stored = resetCodes[user._id];
    const submittedCode = String(code).trim();

    if (!stored) {
      console.log("Reset password failed: invalid or expired code for " + email);
      return res.status(400).json({ message: "Invalid or expired code!" });
    }

    if (Date.now() > stored.expires) {
      delete resetCodes[user._id];
      console.log("Reset password failed: code expired for " + email);
      return res.status(400).json({ message: "Code has expired!" });
    }

    stored.attempts = stored.attempts || 0;

    if (stored.attempts >= 5) {
      delete resetCodes[user._id];
      console.log("Reset password failed: too many invalid attempts for " + email);
      return res.status(429).json({
        message: "Too many invalid attempts. Please request a new code."
      });
    }

    if (stored.code !== submittedCode) {
      stored.attempts += 1;
      console.log("Reset password failed: wrong code for " + email);
      return res.status(400).json({ message: "Invalid or expired code!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete resetCodes[user._id];

    console.log(`Password reset successful for: ${email}`);

    res.status(200).json({ message: "Password reset successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update profile (requires Authorization header with Bearer token)
router.put("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { name, email, password, profileImage } = req.body;

    const user = await User.findById(payload.id);

    if (!user) {
      console.log("Profile update failed: user not found");
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof profileImage !== "undefined") user.profileImage = profileImage;

    if (password) {
      const hashed = bcrypt.hashSync(password, 10);
      user.password = hashed;
    }

    await user.save();

    const newToken = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "1h" }
    );

    console.log(`Profile updated for: ${user.email}`);

    res.status(200).json({
      message: "Profile updated successfully!",
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      token: newToken
    });
  } catch (err) {
    console.error("Profile update error: " + err);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/complete-questionnaire", async (req, res) => {
  try {
    const { userId, preferences } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 SAVE ALL QUESTIONNAIRE DATA
    user.preferences = preferences;
    user.isFirstTime = false;

    await user.save();

    res.status(200).json({
      message: "Questionnaire saved successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

