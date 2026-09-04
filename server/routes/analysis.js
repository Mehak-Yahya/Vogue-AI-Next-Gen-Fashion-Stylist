const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeSkinAndSeason } = require('../services/visionService');

// Use memory storage to handle image in memory without saving to disk
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze-skin', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file.' });
    }

    const visionResults = await analyzeSkinAndSeason(req.file.buffer, req.file.originalname);

    return res.status(200).json({
      success: true,
      data: visionResults
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;