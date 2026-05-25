const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');
router.use(protect);
router.get('/', getActivities);
module.exports = router;
