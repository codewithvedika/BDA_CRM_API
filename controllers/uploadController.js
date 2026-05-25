const cloudinary = require('cloudinary').v2;
const Lead = require('../models/Lead');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc  Upload file to lead
const uploadFile = async (req, res) => {
  const { leadId } = req.params;
  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `bda-crm/leads/${leadId}`,
      resource_type: 'auto',
    });

    lead.files.push({ name: req.file.originalname, url: result.secure_url, publicId: result.public_id });
    await lead.save();

    res.json({ url: result.secure_url, name: req.file.originalname });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// @desc  Delete file from lead
const deleteFile = async (req, res) => {
  const { leadId, publicId } = req.params;
  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  await cloudinary.uploader.destroy(publicId);
  lead.files = lead.files.filter((f) => f.publicId !== publicId);
  await lead.save();

  res.json({ message: 'File deleted' });
};

module.exports = { uploadFile, deleteFile };
