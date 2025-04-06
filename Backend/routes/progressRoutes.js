const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { 
  addProblem, 
  getUserProgress, 
  getPlatformProgress,
  syncProgressWithProfiles
} = require('../controllers/progressController');

const router = express.Router();

// Add problem to progress
router.post('/problems', verifyToken, addProblem);

// Get all progress for user
router.get('/', verifyToken, getUserProgress);

// Get progress for specific platform
router.get('/:platform', verifyToken, getPlatformProgress);

// Sync progress with platform profiles
router.post('/sync', verifyToken, syncProgressWithProfiles);

module.exports = router;
