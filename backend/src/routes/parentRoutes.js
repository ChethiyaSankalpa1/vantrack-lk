const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { getParentDashboard } = require('../controllers/parentController');

router.get('/dashboard', protect, authorize('parent'), getParentDashboard);

module.exports = router;
