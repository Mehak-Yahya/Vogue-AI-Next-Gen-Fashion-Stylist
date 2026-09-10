const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
require('dotenv').config();
const { analyzeSkinAndSeason } = require('./services/visionService');
const wardrobeRoutes = require('./routes/wardrobe');
const authRoutes = require('./routes/auth');
const recommendationRoutes = require('./routes/recommendations');
const { requireAuth } = require('./middleware/requireAuth');

const app = express();
const PORT = process.env.PORT || 5000;
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8001';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Middleware
app.use(cors());
app.use('/api', apiLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static('uploads'));
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
app.post('/api/chat-rag', async (req, res) => {
  try {
    const { season, question, history } = req.body;
    const response = await axios.post(`${RAG_SERVICE_URL}/chat-rag`, {
      season: season || '',
      question: question || '',
      history: Array.isArray(history) ? history : [],
    });

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

    const visionResults = await analyzeSkinAndSeason(
      req.file.buffer,
      req.file.originalname,
    );

    return res.status(200).json({ success: true, data: visionResults });
  } catch (error) {
    console.error('Bridge Error:', error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});
const startServer = async () => {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vogue-ai';

    console.log('Connecting to local MongoDB...');

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
      minPoolSize: 2,
    });

    console.log('Connected to local MongoDB');

    app.listen(PORT, () => {
      console.log(
        `Vogue AI Express Backend running on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error('MongoDB connection fai<ArrowUp2 />led:', error.message);
    console.error('Make sure MongoDB is running on 127.0.0.1:27017');
    process.exit(1);
  }
};

startServer();