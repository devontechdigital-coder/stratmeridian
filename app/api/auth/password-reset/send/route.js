import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import EmailVerification from '@/models/EmailVerification';
import { sendSmtpMail } from '@/lib/emailSmtp';

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email }).select('_id email name isBlocked');
    if (!user || user.isBlocked) {
      return NextResponse.json({ success: false, message: 'No active account found with this email' }, { status: 404 });
    }

    const otp = generateOtp();
    await sendSmtpMail({
      to: email,
      subject: 'Reset your password',
      text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    await EmailVerification.deleteMany({ email, purpose: 'password-reset' });
    await EmailVerification.create({
      email,
      otpHash: await bcrypt.hash(otp, 10),
      purpose: 'password-reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return NextResponse.json({ success: true, message: 'Password reset OTP sent successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to send reset OTP' }, { status: 500 });
  }
}
