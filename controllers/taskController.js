const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc  Get tasks
const getTasks = async (req, res) => {
  const { status, lead, assignedTo } = req.query;
  const query = {};
  if (req.user.role === 'bda') query.assignedTo = req.user._id;
  if (status) query.status = status;
  if (lead) query.lead = lead;
  if (assignedTo && req.user.role === 'admin') query.assignedTo = assignedTo;

  // Auto-mark overdue
  await Task.updateMany(
    { dueDate: { $lt: new Date() }, status: { $in: ['Pending', 'In Progress'] } },
    { status: 'Overdue' }
  );

  const tasks = await Task.find(query)
    .populate('lead', 'name company')
    .populate('assignedTo', 'name avatar')
    .populate('createdBy', 'name')
    .sort({ dueDate: 1 });

  res.json(tasks);
};

// @desc  Create task
const createTask = async (req, res) => {
  const io = req.app.get('io');
  const task = await Task.create({ ...req.body, createdBy: req.user._id });
  await task.populate('lead', 'name company');
  await task.populate('assignedTo', 'name avatar');

  await Activity.create({
    user: req.user._id,
    lead: task.lead?._id,
    action: 'task_created',
    description: `${req.user.name} created task: ${task.title}`,
  });

  if (task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString()) {
    io?.to(task.assignedTo._id.toString()).emit('notification', {
      type: 'task_assigned',
      message: `New task assigned: ${task.title}`,
    });
  }

  res.status(201).json(task);
};

// @desc  Update task
const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  if (req.body.status === 'Completed') req.body.completedAt = new Date();
  Object.assign(task, req.body);
  const updated = await task.save();
  await updated.populate('lead', 'name company');
  await updated.populate('assignedTo', 'name avatar');

  res.json(updated);
};

// @desc  Delete task
const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  await task.deleteOne();
  res.json({ message: 'Task deleted' });
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
