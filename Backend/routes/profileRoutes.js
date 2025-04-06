const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { 
  syncPlatformProfile, 
  syncAllPlatforms,
  getAllPlatformProfiles,
  getPlatformProfile
} = require('../controllers/profileController');

const router = express.Router();

// Sync all platforms
router.post('/sync', verifyToken, syncAllPlatforms);

// Sync specific platform
router.post('/sync/:platform', verifyToken, syncPlatformProfile);

// Get all platform profiles
router.get('/', verifyToken, getAllPlatformProfiles);

// Get platform profile for specific platform
router.get('/:platform', verifyToken, getPlatformProfile);

module.exports = router;
