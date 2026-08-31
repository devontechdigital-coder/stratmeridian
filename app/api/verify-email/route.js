import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import EmailVerification from '@/models/EmailVerification';
import { sendSmtpMail } from '@/lib/emailSmtp';
import bcrypt from 'bcryptjs';

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isEmailDeliveryError(error) {
  const message = error?.message || '';
  return (
    message.includes('SMTP settings are not configured') ||
    /Invalid login|authentication|auth|credentials|535/i.test(message)
  );
}

function getEmailDeliveryMessage(error) {
  const message = error?.message || '';
  if (message.includes('SMTP settings are not configured')) {
    return 'Email settings are not configured. Please update SMTP details in admin theme settings.';
  }

  if (/Invalid login|authentication|auth|credentials|535/i.test(message)) {
    return 'Email SMTP login failed. Please check SMTP user and password in admin theme settings.';
  }

  return 'Unable to send OTP email. Please check email settings and try again.';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address' }, { status: 400 });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email }).select('_id email name');
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await sendSmtpMail({
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    await EmailVerification.deleteMany({
      email,
      $or: [{ purpose: 'email-verification' }, { purpose: { $exists: false } }],
    });
    await EmailVerification.create({
      email,
      otpHash,
      purpose: 'email-verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      existingUser: Boolean(existingUser),
      user: existingUser ? { id: existingUser._id, email: existingUser.email, name: existingUser.name } : null,
    });
  } catch (error) {
    if (isEmailDeliveryError(error)) {
      return NextResponse.json({ success: false, message: getEmailDeliveryMessage(error) }, { status: 400 });
    }

    console.error('Verify email error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
