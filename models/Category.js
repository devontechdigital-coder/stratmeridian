import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
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
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  imageUrl: String,
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

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
