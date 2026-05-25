const Lead = require('../models/Lead');
const User = require('../models/User');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc  Get dashboard stats
const getDashboardStats = async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const baseQuery = isAdmin ? {} : { assignedTo: req.user._id };

  const [
    totalLeads,
    newLeads,
    contactedLeads,
    wonLeads,
    lostLeads,
    pendingTasks,
    overdueTasks,
  ] = await Promise.all([
    Lead.countDocuments(baseQuery),
    Lead.countDocuments({ ...baseQuery, status: 'New Lead' }),
    Lead.countDocuments({ ...baseQuery, status: 'Contacted' }),
    Lead.countDocuments({ ...baseQuery, status: 'Won' }),
    Lead.countDocuments({ ...baseQuery, status: 'Lost' }),
    Task.countDocuments({ ...( isAdmin ? {} : { assignedTo: req.user._id }), status: 'Pending' }),
    Task.countDocuments({ ...( isAdmin ? {} : { assignedTo: req.user._id }), status: 'Overdue' }),
  ]);

  const revenueResult = await Lead.aggregate([
    { $match: { ...baseQuery, status: 'Won' } },
    { $group: { _id: null, total: { $sum: '$actualDealValue' } } },
  ]);
  const revenue = revenueResult[0]?.total || 0;

  const pipelineValue = await Lead.aggregate([
    { $match: { ...baseQuery, status: { $nin: ['Won', 'Lost'] } } },
    { $group: { _id: null, total: { $sum: '$expectedDealValue' } } },
  ]);

  res.json({
    totalLeads,
    newLeads,
    contactedLeads,
    wonLeads,
    lostLeads,
    pendingTasks,
    overdueTasks,
    revenue,
    pipelineValue: pipelineValue[0]?.total || 0,
    conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0,
  });
};

// @desc  Monthly lead stats (chart)
const getMonthlyStats = async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const baseMatch = isAdmin ? {} : { assignedTo: req.user._id };

  const months = await Lead.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, '$actualDealValue', 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 },
  ]);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = months.map((m) => ({
    month: monthNames[m._id.month - 1],
    total: m.total,
    won: m.won,
    revenue: m.revenue,
  }));

  res.json(data);
};

// @desc  Team performance (admin only)
const getTeamPerformance = async (req, res) => {
  const performance = await Lead.aggregate([
    { $match: { assignedTo: { $exists: true } } },
    {
      $group: {
        _id: '$assignedTo',
        totalLeads: { $sum: 1 },
        wonLeads: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, '$actualDealValue', 0] } },
      },
    },
    { $sort: { wonLeads: -1 } },
  ]);

  const populated = await User.populate(performance, { path: '_id', select: 'name email avatar' });

  res.json(
    populated.map((p) => ({
      user: p._id,
      totalLeads: p.totalLeads,
      wonLeads: p.wonLeads,
      revenue: p.revenue,
      conversionRate: p.totalLeads > 0 ? ((p.wonLeads / p.totalLeads) * 100).toFixed(1) : 0,
    }))
  );
};

// @desc  Lead sources breakdown
const getLeadSources = async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const baseMatch = isAdmin ? {} : { assignedTo: req.user._id };

  const sources = await Lead.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json(sources.map((s) => ({ name: s._id, value: s.count })));
};

// @desc  Pipeline funnel data
const getPipelineData = async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const baseMatch = isAdmin ? {} : { assignedTo: req.user._id };
  const stages = ['New Lead','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'];

  const counts = await Lead.aggregate([
    { $match: baseMatch },
    { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$expectedDealValue' } } },
  ]);

  const map = {};
  counts.forEach((c) => (map[c._id] = { count: c.count, value: c.value }));

  res.json(stages.map((s) => ({ stage: s, count: map[s]?.count || 0, value: map[s]?.value || 0 })));
};

module.exports = { getDashboardStats, getMonthlyStats, getTeamPerformance, getLeadSources, getPipelineData };
