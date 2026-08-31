import mongoose from 'mongoose';

const UploadedDocumentSchema = new mongoose.Schema({
  name: String,
  displayName: String,
  url: String,
  publicId: String,
  contentType: String,
  size: Number,
  source: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  uploadedAt: Date,
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: String,
  phoneCountry: {
    type: String,
    default: 'US',
  },
  address: String,
  city: String,
  state: String,
  country: String,
  documents: [UploadedDocumentSchema],
  amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'usd',
    lowercase: true,
    trim: true,
  },
  paymentStatus: {
    type: String,
    enum: ['not_required', 'pending', 'paid', 'failed'],
    default: 'not_required',
  },
  stripeCheckoutSessionId: String,
  stripePaymentIntentId: String,
  status: {
    type: String,
    enum: ['submitted', 'new', 'pending', 'processing', 'completed', 'cancelled'],
    default: 'new',
  },
  adminComment: {
    type: String,
    default: '',
    trim: true,
  },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
