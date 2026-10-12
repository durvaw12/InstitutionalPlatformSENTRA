const express = require('express');
const { departmentReport, departmentDetail } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(protect, authorize('administrator'));

router.get('/departments', departmentReport);
router.get('/departments/:department', departmentDetail);

module.exports = router;
