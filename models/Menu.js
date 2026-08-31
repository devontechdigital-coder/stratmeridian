import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema();
MenuItemSchema.add({
  id: String,
  text: String,
  href: String,
  target: { type: String, default: '_self' },
  children: [MenuItemSchema],
});

const MenuSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['header', 'footer'],
    required: true,
    unique: true,
  },
  items: [MenuItemSchema],
}, { timestamps: true });

export default mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
