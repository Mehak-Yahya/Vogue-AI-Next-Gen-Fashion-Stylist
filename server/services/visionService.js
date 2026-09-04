const axios = require('axios');
const FormData = require('form-data');

const PYTHON_VISION_URL = process.env.PYTHON_VISION_URL || 'http://127.0.0.1:8000';

/**
 * Sends image buffer to Python FastAPI service for color analysis
 * @param {Buffer} imageBuffer - Raw image buffer from multer upload
 * @param {string} filename - Original file name
 */
const analyzeSkinAndSeason = async (imageBuffer, filename = 'selfie.png') => {
  try {
    const formData = new FormData();
    formData.append('file', imageBuffer, { filename });

    const response = await axios.post(`${PYTHON_VISION_URL}/analyze-season`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error communicating with Python Vision service:', error.message);
    throw new Error('Vision analysis service failed.');
  }
};

module.exports = { analyzeSkinAndSeason };