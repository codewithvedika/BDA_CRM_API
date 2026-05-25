const User = require('../models/User');
const Lead = require('../models/Lead');

// @desc  Get all users (admin)
const getUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const assignedLeads = await Lead.countDocuments({ assignedTo: user._id });
      const wonLeads = await Lead.countDocuments({ assignedTo: user._id, status: 'Won' });
      return { ...user.toObject(), assignedLeads, wonLeads };
    })
  );
  res.json(usersWithStats);
};

// @desc  Get single user
const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// @desc  Create user (admin)
const createUser = async (req, res) => {
  const { name, email, password, role, phone, department } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'User already exists' });
  const user = await User.create({ name, email, password, role, phone, department });
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
};

// @desc  Update user (admin)
const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  Object.assign(user, req.body);
  if (req.body.password) user.password = req.body.password;
  const updated = await user.save();
  res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
};

// @desc  Delete user (admin)
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user._id.toString() === req.user._id.toString())
    return res.status(400).json({ message: 'Cannot delete yourself' });
  await user.deleteOne();
  res.json({ message: 'User deleted' });
};

// @desc  Get BDA employees (for dropdown)
const getBDAList = async (req, res) => {
  const bdas = await User.find({ role: 'bda', isActive: true }).select('name email avatar');
  res.json(bdas);
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, getBDAList };
