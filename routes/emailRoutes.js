const express = require('express');
const router = express.Router();
const { sendFollowUpEmail } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');
router.use(protect);
router.post('/send', sendFollowUpEmail);
module.exports = router;
