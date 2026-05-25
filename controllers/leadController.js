const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const User = require('../models/User');

const logActivity = async (userId, leadId, action, description, metadata = {}) => {
  await Activity.create({ user: userId, lead: leadId, action, description, metadata });
};

const emitNotification = (io, userId, event, data) => {
  if (io && userId) io.to(userId.toString()).emit(event, data);
};

// @desc  Get all leads (admin) or assigned leads (bda)
const getLeads = async (req, res) => {
  const { status, priority, assignedTo, search, source, industry, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role === 'bda') query.assignedTo = req.user._id;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo && req.user.role === 'admin') query.assignedTo = assignedTo;
  if (source) query.source = source;
  if (industry) query.industry = industry;
  if (search) query.$text = { $search: search };

  const total = await Lead.countDocuments(query);
  const leads = await Lead.find(query)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ leads, total, page: Number(page), pages: Math.ceil(total / limit) });
};

// @desc  Get leads grouped by status (Kanban)
const getKanbanLeads = async (req, res) => {
  const query = req.user.role === 'bda' ? { assignedTo: req.user._id } : {};
  const leads = await Lead.find(query)
    .populate('assignedTo', 'name avatar')
    .sort({ position: 1 });

  const kanban = {
    'New Lead': [],
    Contacted: [],
    Qualified: [],
    'Proposal Sent': [],
    Negotiation: [],
    Won: [],
    Lost: [],
  };

  leads.forEach((lead) => {
    if (kanban[lead.status]) kanban[lead.status].push(lead);
  });

  res.json(kanban);
};

// @desc  Get single lead
const getLead = async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('assignedTo', 'name email avatar phone')
    .populate('createdBy', 'name email');

  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  if (req.user.role === 'bda' && lead.assignedTo?._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json(lead);
};

// @desc  Create lead
const createLead = async (req, res) => {
  const io = req.app.get('io');
  const lead = await Lead.create({ ...req.body, createdBy: req.user._id });
  await lead.populate('assignedTo', 'name email avatar');

  await logActivity(req.user._id, lead._id, 'created', `${req.user.name} created lead ${lead.name}`);

  if (lead.assignedTo) {
    emitNotification(io, lead.assignedTo._id, 'notification', {
      type: 'lead_assigned',
      message: `New lead assigned: ${lead.name}`,
      leadId: lead._id,
    });
  }

  res.status(201).json(lead);
};

// @desc  Update lead
const updateLead = async (req, res) => {
  const io = req.app.get('io');
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  const oldStatus = lead.status;
  if (req.body.status === 'Won' || req.body.status === 'Lost') req.body.closedAt = new Date();

  Object.assign(lead, req.body);
  const updated = await lead.save();
  await updated.populate('assignedTo', 'name email avatar');

  if (oldStatus !== updated.status) {
    await logActivity(
      req.user._id,
      lead._id,
      'status_changed',
      `${req.user.name} moved ${lead.name} from ${oldStatus} to ${updated.status}`,
      { from: oldStatus, to: updated.status }
    );
    if (updated.assignedTo) {
      emitNotification(io, updated.assignedTo._id, 'notification', {
        type: 'status_changed',
        message: `Lead "${lead.name}" moved to ${updated.status}`,
        leadId: lead._id,
      });
    }
  } else {
    await logActivity(req.user._id, lead._id, 'updated', `${req.user.name} updated lead ${lead.name}`);
  }

  res.json(updated);
};

// @desc  Update kanban positions
const updateKanbanPositions = async (req, res) => {
  const { updates } = req.body; // [{ id, status, position }]
  const io = req.app.get('io');

  await Promise.all(
    updates.map(({ id, status, position }) =>
      Lead.findByIdAndUpdate(id, { status, position })
    )
  );

  const movedItem = updates[0];
  if (movedItem) {
    const lead = await Lead.findById(movedItem.id);
    if (lead) {
      await logActivity(
        req.user._id,
        lead._id,
        'status_changed',
        `${req.user.name} moved ${lead.name} to ${movedItem.status}`,
        { to: movedItem.status }
      );
    }
  }

  res.json({ message: 'Positions updated' });
};

// @desc  Delete lead
const deleteLead = async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  await lead.deleteOne();
  await logActivity(req.user._id, null, 'deleted', `${req.user.name} deleted lead ${lead.name}`);
  res.json({ message: 'Lead deleted' });
};

module.exports = { getLeads, getKanbanLeads, getLead, createLead, updateLead, updateKanbanPositions, deleteLead };
