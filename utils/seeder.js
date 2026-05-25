const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const seed = async () => {
  await connectDB();
  await User.deleteMany();
  await Lead.deleteMany();
  await Activity.deleteMany();

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@bdacrm.com',
    password: 'admin123',
    role: 'admin',
    phone: '9876543210',
    department: 'Management',
  });

  const bda1 = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul@bdacrm.com',
    password: 'bda123',
    role: 'bda',
    phone: '9123456780',
    department: 'Sales',
  });

  const bda2 = await User.create({
    name: 'Sneha Patel',
    email: 'sneha@bdacrm.com',
    password: 'bda123',
    role: 'bda',
    phone: '9012345678',
    department: 'Sales',
  });

  const leads = [
    { name: 'Anil Kumar', company: 'Tata Steel Ltd', email: 'anil@tatasteel.com', phone: '9876501234', industry: 'Manufacturing', source: 'Referral', status: 'Won', priority: 'High', expectedDealValue: 500000, actualDealValue: 480000, assignedTo: bda1._id, createdBy: admin._id },
    { name: 'Priya Mehta', company: 'Mahindra Auto', email: 'priya@mahindra.com', phone: '9871234560', industry: 'Automotive', source: 'LinkedIn', status: 'Negotiation', priority: 'High', expectedDealValue: 750000, assignedTo: bda1._id, createdBy: admin._id },
    { name: 'Vikram Nair', company: 'Reliance Chemicals', email: 'vikram@reliance.com', phone: '9864523170', industry: 'Chemical', source: 'Website', status: 'Proposal Sent', priority: 'Medium', expectedDealValue: 320000, assignedTo: bda2._id, createdBy: admin._id },
    { name: 'Kavita Singh', company: 'Havells Electronics', email: 'kavita@havells.com', phone: '9812345670', industry: 'Electronics', source: 'Cold Call', status: 'Qualified', priority: 'Medium', expectedDealValue: 180000, assignedTo: bda2._id, createdBy: admin._id },
    { name: 'Suresh Rao', company: 'Cipla Pharma', email: 'suresh@cipla.com', phone: '9845678901', industry: 'Pharma', source: 'Trade Show', status: 'Contacted', priority: 'Low', expectedDealValue: 90000, assignedTo: bda1._id, createdBy: admin._id },
    { name: 'Meena Joshi', company: 'Amul Foods', email: 'meena@amul.com', phone: '9834567890', industry: 'Food & Beverage', source: 'Email Campaign', status: 'New Lead', priority: 'Medium', expectedDealValue: 250000, assignedTo: bda2._id, createdBy: admin._id },
    { name: 'Deepak Verma', company: 'Larsen & Toubro', email: 'deepak@lnt.com', phone: '9823456789', industry: 'Construction', source: 'Referral', status: 'New Lead', priority: 'High', expectedDealValue: 1200000, assignedTo: bda1._id, createdBy: admin._id },
    { name: 'Anjali Roy', company: 'Asian Paints', email: 'anjali@asianpaints.com', phone: '9812345601', industry: 'Manufacturing', source: 'Website', status: 'Lost', priority: 'Low', expectedDealValue: 150000, lostReason: 'Budget constraints', assignedTo: bda2._id, createdBy: admin._id },
  ];

  const createdLeads = await Lead.insertMany(leads);

  await Activity.insertMany([
    { user: bda1._id, lead: createdLeads[0]._id, action: 'status_changed', description: 'Rahul moved Anil Kumar to Won', createdAt: new Date(Date.now() - 86400000) },
    { user: bda2._id, lead: createdLeads[2]._id, action: 'note_added', description: 'Sneha added a note to Reliance Chemicals', createdAt: new Date(Date.now() - 3600000) },
    { user: admin._id, lead: createdLeads[6]._id, action: 'created', description: 'Admin created lead Deepak Verma', createdAt: new Date(Date.now() - 7200000) },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('Admin: admin@bdacrm.com / admin123');
  console.log('BDA1:  rahul@bdacrm.com / bda123');
  console.log('BDA2:  sneha@bdacrm.com / bda123');
  process.exit();
};

seed().catch((err) => { console.error(err); process.exit(1); });
