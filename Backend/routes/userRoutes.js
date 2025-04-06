const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { 
  updateProfile, 
  addPlatformHandle, 
  removePlatformHandle 
} = require('../controllers/userController');

const router = express.Router();

// Update user profile
router.put('/profile', verifyToken, updateProfile);

// Add platform handle
router.post('/platform-handles', verifyToken, addPlatformHandle);

// Remove platform handle
router.delete('/platform-handles/:platform', verifyToken, removePlatformHandle);

module.exports = router;
