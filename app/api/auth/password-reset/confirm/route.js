import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import EmailVerification from '@/models/EmailVerification';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();
    const password = body.password?.toString();

    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !otp || !password) {
      return NextResponse.json({ success: false, message: 'Email, OTP and new password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user || user.isBlocked) {
      return NextResponse.json({ success: false, message: 'No active account found with this email' }, { status: 404 });
    }

    const verification = await EmailVerification.findOne({
      email,
      purpose: 'password-reset',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verification) {
      return NextResponse.json({ success: false, message: 'OTP expired. Please request a new code.' }, { status: 400 });
    }

    const validOtp = await bcrypt.compare(otp, verification.otpHash);
    if (!validOtp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 10);
    user.orderLoginTokenHash = undefined;
    user.orderLoginTokenExpiresAt = undefined;
    await user.save();
    await EmailVerification.deleteMany({ email, purpose: 'password-reset' });

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
