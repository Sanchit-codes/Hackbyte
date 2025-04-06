const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { registerUser, getCurrentUser } = require('../controllers/authController');

const router = express.Router();

// Register or update user after Firebase login
router.post('/register', verifyToken, registerUser);

// Get current user
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
