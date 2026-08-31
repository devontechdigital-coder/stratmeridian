import mongoose from 'mongoose';

const EmailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['email-verification', 'login', 'password-reset'],
    default: 'email-verification',
    index: true,
  },
  verificationTokenHash: String,
  verified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
}, { timestamps: true });

export default mongoose.models.EmailVerification || mongoose.model('EmailVerification', EmailVerificationSchema);
