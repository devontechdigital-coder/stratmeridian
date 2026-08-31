import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'theme',
    unique: true
  },
  websiteName: {
    type: String,
    default: ''
  },
  metaTitle: {
    type: String,
    default: ''
  },
  metaDescription: {
    type: String,
    default: ''
  },
  metaKeywords: {
    type: String,
    default: ''
  },
  headCode: {
    type: String,
    default: ''
  },
  metaLogo: {
    type: String,
    default: ''
  },
  metaFavicon: {
    type: String,
    default: ''
  },
  footerCredit: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  defaultPhoneCountry: {
    type: String,
    default: 'US'
  },
  emailId: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  smtpHost: {
    type: String,
    default: ''
  },
  smtpPort: {
    type: Number,
    default: 587
  },
  smtpSecure: {
    type: Boolean,
    default: false
  },
  smtpUser: {
    type: String,
    default: ''
  },
  smtpPassword: {
    type: String,
    default: ''
  },
  smtpFromEmail: {
    type: String,
    default: ''
  },
  smtpFromName: {
    type: String,
    default: ''
  },
  stripeEnabled: {
    type: Boolean,
    default: false
  },
  stripePublishableKey: {
    type: String,
    default: ''
  },
  stripeSecretKey: {
    type: String,
    default: ''
  },
  stripeCurrency: {
    type: String,
    default: 'usd'
  }
}, { timestamps: true, strict: false });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
