import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { requireModulePermission } from '@/lib/adminPermissions';
import { normalizePhoneCountry, validateAndFormatPhone } from '@/utils/phone';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne({ type: 'theme' });
    
    if (!settings) {
      settings = await Settings.create({ type: 'theme' });
    }
    
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const permission = await requireModulePermission('settings', 'edit');
    if (!permission.ok) {
      return permission.response;
    }

    await connectToDatabase();
    const body = await req.json();
    body.defaultPhoneCountry = normalizePhoneCountry(body.defaultPhoneCountry);
    body.address = typeof body.address === 'string' ? body.address : '';
    body.city = typeof body.city === 'string' ? body.city : '';
    body.state = typeof body.state === 'string' ? body.state : '';
    body.country = typeof body.country === 'string' ? body.country : '';
    body.footerTagline = typeof body.footerTagline === 'string' ? body.footerTagline : '';
    body.footerCredit = typeof body.footerCredit === 'string' ? body.footerCredit : '';

    if (body.phoneNumber) {
      const phone = validateAndFormatPhone(body.phoneNumber, body.defaultPhoneCountry);
      if (!phone.valid) {
        return NextResponse.json({ success: false, message: 'Please enter a valid phone number' }, { status: 400 });
      }
      body.phoneNumber = phone.formatted;
    }
    
    await Settings.findOneAndUpdate(
      { type: 'theme' },
      { ...body, type: 'theme' },
      { new: true, upsert: true }
    );

    await Settings.collection.updateOne(
      { type: 'theme' },
      {
        $set: {
          address: body.address,
          city: body.city,
          state: body.state,
          country: body.country,
          footerTagline: body.footerTagline,
          footerCredit: body.footerCredit,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const settings = await Settings.findOne({ type: 'theme' }).lean();
    
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
