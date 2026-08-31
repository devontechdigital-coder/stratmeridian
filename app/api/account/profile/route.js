import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import Order from '@/models/Order';
import { normalizePhoneCountry, validateAndFormatPhone } from '@/utils/phone';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const [user, latestOrder] = await Promise.all([
      User.findById(session.user.id).select('name email role phone phoneCountry address city state country').lean(),
      Order.findOne({ user: session.user.id }).sort({ createdAt: -1 }).select('phone phoneCountry address city state country').lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        phone: user?.phone || latestOrder?.phone || '',
        phoneCountry: user?.phoneCountry || latestOrder?.phoneCountry || 'US',
        address: user?.address || latestOrder?.address || '',
        city: user?.city || latestOrder?.city || '',
        state: user?.state || latestOrder?.state || '',
        country: user?.country || latestOrder?.country || '',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = body.name?.toString().trim();
    const phone = body.phone?.toString().trim() || '';
    const phoneCountryInput = body.phoneCountry?.toString();
    const address = body.address?.toString().trim() || '';
    const city = body.city?.toString().trim() || '';
    const state = body.state?.toString().trim() || '';
    const country = body.country?.toString().trim() || '';

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const phoneCountry = normalizePhoneCountry(phoneCountryInput);
    let formattedPhone = { formatted: '', country: phoneCountry };
    if (phone) {
      const phoneResult = validateAndFormatPhone(phone, phoneCountry);
      if (!phoneResult.valid) {
        return NextResponse.json({ success: false, message: 'Please enter a valid phone number' }, { status: 400 });
      }
      formattedPhone = phoneResult;
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        name,
        phone: formattedPhone.formatted,
        phoneCountry: formattedPhone.country,
        address,
        city,
        state,
        country,
      },
      { new: true, runValidators: true }
    ).select('name email role phone phoneCountry address city state country');

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
