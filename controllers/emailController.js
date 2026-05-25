const nodemailer = require('nodemailer');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// @desc  Send follow-up email to lead
const sendFollowUpEmail = async (req, res) => {
  const { leadId, subject, message } = req.body;
  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: lead.email,
      subject: subject || `Follow-up from BDA Team`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1e40af">BDA CRM</h2>
        <p>Dear ${lead.name},</p>
        <p>${message}</p>
        <p>Best regards,<br>${req.user.name}</p>
      </div>`,
    });

    await Activity.create({
      user: req.user._id,
      lead: leadId,
      action: 'email_sent',
      description: `${req.user.name} sent email to ${lead.name}: "${subject}"`,
    });

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email', error: err.message });
  }
};

module.exports = { sendFollowUpEmail };
