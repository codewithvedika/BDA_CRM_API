const express = require('express');
const router = express.Router();
const { getNotes, createNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
router.use(protect);
router.route('/lead/:leadId').get(getNotes).post(createNote);
router.route('/:id').delete(deleteNote);
module.exports = router;
