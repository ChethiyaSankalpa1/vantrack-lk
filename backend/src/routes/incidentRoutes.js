const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getIncidents, getIncidentById } = require('../controllers/incidentController');

router.get('/', protect, getIncidents);
router.get('/:id', protect, getIncidentById);

module.exports = router;
