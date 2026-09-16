const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { analyzeSkinAndSeason } = require('./services/visionService');
const wardrobeRoutes = require('./routes/wardrobe');
const authRoutes = require('./routes/auth');
const recommendationRoutes = require('./routes/recommendations');
const billingRoutes = require('./routes/billing');
const { requireAuth } = require('./middleware/requireAuth');
const { csrfProtection } = require('./middleware/csrf');
const { validateImage } = require('./utils/validateImage');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8001';
const MONGODB_RETRY_DELAY_MS = 5000;
const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many assistant requests. Please try again later.' },
});

// Middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));
app.use(cors({
  origin: (requestOrigin, callback) => {
    const normalizedOrigin = requestOrigin?.replace(/\/$/, '');
    if (!normalizedOrigin || clientOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use('/api', apiLimiter);
app.use('/api/billing', billingRoutes);
app.use('/api', csrfProtection);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Configure Multer (memory storage so images aren't stored locally on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit image size to 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Vogue AI Express Server is running' });
});

// Forward RAG requests through the same gateway used by the React client.
app.post('/api/chat-rag', requireAuth, chatLimiter, async (req, res) => {
  try {
    const { season, question, history } = req.body;
    const trimmedQuestion = String(question || '').trim();
    const safeHistory = Array.isArray(history) ? history.slice(-20) : [];

    if (!trimmedQuestion || trimmedQuestion.length > 1000) {
      return res.status(400).json({ error: 'Question must be between 1 and 1000 characters.' });
    }

    const response = await axios.post(`${RAG_SERVICE_URL}/chat-rag`, {
      season: season || '',
      question: trimmedQuestion,
      history: safeHistory,
    }, { timeout: 30_000 });

    return res.json(response.data);
  } catch (error) {
    console.error('Express RAG Forwarding Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'RAG microservice unreachable',
    });
  }
});

// Color Analysis API Route
app.post('/api/analyze-skin', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file.' });
    }

    await validateImage(req.file.buffer);

    const visionResults = await analyzeSkinAndSeason(
      req.file.buffer,
      req.file.originalname,
    );

    return res.status(200).json({ success: true, data: visionResults });
  } catch (error) {
    console.error('Bridge Error:', error.response?.data || error.message);
    if (error.message.includes('image') || error.message.includes('Image')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Skin analysis service unavailable.' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'The uploaded image is too large.'
      : 'The uploaded image could not be processed.';
    return res.status(400).json({ error: message });
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: error.message });
  }
  console.error('Unhandled server error:', error.message);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});
const startServer = async () => {
  const MONGODB_URI =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vogue-ai';

  while (mongoose.connection.readyState !== 1) {
    try {
      console.log('Connecting to local MongoDB...');

      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: MONGODB_RETRY_DELAY_MS,
        maxPoolSize: 20,
        minPoolSize: 2,
      });

      console.log('Connected to local MongoDB');
    } catch (error) {
      console.warn(
        `MongoDB unavailable. Retrying in ${MONGODB_RETRY_DELAY_MS / 1000}s: ${error.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, MONGODB_RETRY_DELAY_MS));
    }
  }

  app.listen(PORT, () => {
    console.log(
      `Vogue AI Express Backend running on http://localhost:${PORT}`,
    );
  });
};

if (require.main === module) startServer();

module.exports = { app, startServer };