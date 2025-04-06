const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { 
  generateSuggestions, 
  getSuggestionHistory 
} = require('../controllers/suggestionController');

const router = express.Router();

// Generate new suggestions
router.post('/', verifyToken, generateSuggestions);

// Get suggestion history
router.get('/history', verifyToken, getSuggestionHistory);

module.exports = router;
