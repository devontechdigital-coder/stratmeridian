import connectToDatabase from './mongodb';
import Settings from '@/models/Settings';

export async function getThemeSettings() {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne({ type: 'theme' }).lean();

    if (!settings) {
      // Return defaults if not found
      return {
        websiteName: '',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        headCode: '',
        metaLogo: '',
        metaFavicon: '',
        footerCredit: '',
        defaultPhoneCountry: 'US',
      };
    }

    // Ensure all fields are present even if new fields were added to schema but not DB
    return {
      ...settings,
      _id: settings._id.toString(),
      createdAt: settings.createdAt?.toISOString(),
      updatedAt: settings.updatedAt?.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}
