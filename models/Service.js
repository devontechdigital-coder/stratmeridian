import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  backgroundImageUrl: String,
  uploadLabel: {
    type: String,
    default: 'Upload documents',
  },
  buttonLabel: {
    type: String,
    default: 'Submit Order',
  },
  shortParagraph: String,
  heroFeatures: [{
    icon: {
      type: String,
      default: 'bi-shield-check',
    },
    title: String,
    description: String,
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  htmlContent: {
    type: String,
    required: false,
  },
  rawHtml: String,
  editorPreference: {
    type: String,
    enum: ['rich', 'raw'],
    default: 'rich',
  },
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
  customCss: String,
  customJs: String,
  status: {
    type: String,
    enum: ['active', 'draft'],
    default: 'active',
  },
}, { timestamps: true, strict: false });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
