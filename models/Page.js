import mongoose from 'mongoose';

const PageSchema = new mongoose.Schema({
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
}, { timestamps: true });

export default mongoose.models.Page || mongoose.model('Page', PageSchema);
