const express = require('express');
const router = express.Router();
const { getLeads, getKanbanLeads, getLead, createLead, updateLead, updateKanbanPositions, deleteLead } = require('../controllers/leadController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/kanban', getKanbanLeads);
router.put('/kanban/positions', updateKanbanPositions);
router.route('/').get(getLeads).post(createLead);
router.route('/:id').get(getLead).put(updateLead).delete(adminOnly, deleteLead);

module.exports = router;
