import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import EmailVerification from '@/models/EmailVerification';
import User from '@/models/User';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    await connectToDatabase();
    const verification = await EmailVerification.findOne({
      email,
      $or: [{ purpose: 'email-verification' }, { purpose: { $exists: false } }],
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verification) {
      return NextResponse.json({ success: false, message: 'OTP expired. Please request a new code.' }, { status: 400 });
    }

    const validOtp = await bcrypt.compare(otp, verification.otpHash);
    if (!validOtp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    verification.verified = true;
    verification.verificationTokenHash = await bcrypt.hash(token, 10);
    verification.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await verification.save();

    const user = await User.findOne({ email });
    let orderLoginToken = '';

    if (user) {
      orderLoginToken = crypto.randomBytes(32).toString('hex');
      user.orderLoginTokenHash = await bcrypt.hash(orderLoginToken, 10);
      user.orderLoginTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      token,
      existingUser: Boolean(user),
      loginEmail: user?.email || '',
      orderLoginToken,
      user: user ? {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        phoneCountry: user.phoneCountry || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
      } : null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
