const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
require('dotenv').config();
const { analyzeSkinAndSeason } = require('./services/visionService');
const wardrobeRoutes = require('./routes/wardrobe');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/auth', authRoutes);

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

// Color Analysis API Route
app.post('/api/analyze-skin', upload.single('image'), async (req, res) => {
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
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } else {
    console.warn('MONGODB_URI is not set; signup persistence is disabled.');
  }

  app.listen(PORT, () => {
    console.log(`Vogue AI Express Backend running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});