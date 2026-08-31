import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import EmailVerification from '@/models/EmailVerification';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user || user.isBlocked) {
      return NextResponse.json({ success: false, message: 'No active account found with this email' }, { status: 404 });
    }

    const verification = await EmailVerification.findOne({
      email,
      purpose: 'login',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verification) {
      return NextResponse.json({ success: false, message: 'OTP expired. Please request a new code.' }, { status: 400 });
    }

    const validOtp = await bcrypt.compare(otp, verification.otpHash);
    if (!validOtp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    const loginToken = crypto.randomBytes(32).toString('hex');
    user.orderLoginTokenHash = await bcrypt.hash(loginToken, 10);
    user.orderLoginTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await EmailVerification.deleteMany({ email, purpose: 'login' });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      loginEmail: user.email,
      loginToken,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to verify OTP' }, { status: 500 });
  }
}
