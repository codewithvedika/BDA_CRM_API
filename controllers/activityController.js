const Activity = require('../models/Activity');

const getActivities = async (req, res) => {
  const { leadId, limit = 20 } = req.query;
  const query = leadId ? { lead: leadId } : {};
  if (req.user.role === 'bda') query.user = req.user._id;

  const activities = await Activity.find(query)
    .populate('user', 'name avatar')
    .populate('lead', 'name company')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json(activities);
};

module.exports = { getActivities };
