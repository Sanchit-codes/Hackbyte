const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { refreshDashboard, getDashboardData } = require('../controllers/dashboardController');

const router = express.Router();

// Get dashboard data
router.get('/', verifyToken, getDashboardData);

// Refresh dashboard data
router.post('/refresh', verifyToken, refreshDashboard);

module.exports = router;
