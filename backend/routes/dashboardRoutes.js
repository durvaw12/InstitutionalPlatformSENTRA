const express = require('express');
const { adminDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();
router.get('/admin', protect, authorize('administrator'), adminDashboard);

module.exports = router;
