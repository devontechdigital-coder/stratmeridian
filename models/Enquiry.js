import mongoose from 'mongoose';

const EnquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  source: {
    type: String,
    default: 'home',
    trim: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null,
  },
  serviceTitle: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'in_progress', 'closed'],
    default: 'new',
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
}, { timestamps: true });

EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ email: 1, createdAt: -1 });

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);
