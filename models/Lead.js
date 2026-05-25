const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    industry: {
      type: String,
      enum: ['Manufacturing', 'Automotive', 'Electronics', 'Textile', 'Chemical', 'Food & Beverage', 'Pharma', 'Construction', 'Other'],
      default: 'Other',
    },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Cold Call', 'Email Campaign', 'LinkedIn', 'Trade Show', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
      default: 'New Lead',
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expectedDealValue: { type: Number, default: 0 },
    actualDealValue: { type: Number, default: 0 },
    nextFollowUpDate: { type: Date },
    closedAt: { type: Date },
    lostReason: { type: String },
    address: { type: String },
    website: { type: String },
    tags: [{ type: String }],
    files: [
      {
        name: String,
        url: String,
        publicId: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

leadSchema.index({ name: 'text', company: 'text', email: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
