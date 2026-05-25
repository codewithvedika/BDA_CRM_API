const Note = require('../models/Note');
const Activity = require('../models/Activity');

const getNotes = async (req, res) => {
  const notes = await Note.find({ lead: req.params.leadId })
    .populate('author', 'name avatar role')
    .sort({ createdAt: -1 });
  res.json(notes);
};

const createNote = async (req, res) => {
  const { content, type } = req.body;
  const note = await Note.create({ lead: req.params.leadId, author: req.user._id, content, type });
  await note.populate('author', 'name avatar role');

  await Activity.create({
    user: req.user._id,
    lead: req.params.leadId,
    action: 'note_added',
    description: `${req.user.name} added a ${type || 'note'}`,
  });

  res.status(201).json(note);
};

const deleteNote = async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  await note.deleteOne();
  res.json({ message: 'Note deleted' });
};

module.exports = { getNotes, createNote, deleteNote };
