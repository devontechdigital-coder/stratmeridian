import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import Service from '@/models/Service';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import EmailVerification from '@/models/EmailVerification';
import { createFolder, uploadFile } from '@/lib/gcs';
import { normalizeGcsPath } from '@/lib/gcs';
import { normalizePhoneCountry, validateAndFormatPhone } from '@/utils/phone';

function randomPassword() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function randomLoginToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const session = await getServerSession(authOptions);

    const serviceId = formData.get('serviceId')?.toString();
    const fullName = formData.get('fullName')?.toString().trim();
    const email = formData.get('email')?.toString().trim().toLowerCase();
    const phone = formData.get('phone')?.toString().trim();
    const phoneCountryInput = formData.get('phoneCountry')?.toString();
    const address = formData.get('address')?.toString().trim();
    const city = formData.get('city')?.toString().trim() || '';
    const state = formData.get('state')?.toString().trim() || '';
    const country = formData.get('country')?.toString().trim() || '';
    const emailVerificationToken = formData.get('emailVerificationToken')?.toString();
    const files = formData.getAll('documents').filter((file) => file?.size);

    if (!serviceId || !fullName || !email || !phone || !address) {
      return NextResponse.json({ success: false, message: 'Please fill all required fields' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Please verify email before submitting' }, { status: 400 });
    }

    const sessionEmail = session?.user?.email?.trim().toLowerCase();
    const sessionEmailValid = Boolean(session?.user?.id && sessionEmail === email);
    let tokenValid = sessionEmailValid;

    if (!tokenValid) {
      const emailVerification = await EmailVerification.findOne({
        email,
        verified: true,
        expiresAt: { $gt: new Date() },
      }).sort({ updatedAt: -1 });

      tokenValid = emailVerification?.verificationTokenHash
        ? await bcrypt.compare(emailVerificationToken || '', emailVerification.verificationTokenHash)
        : false;
    }

    if (!tokenValid) {
      return NextResponse.json({ success: false, message: 'Please verify email OTP before submitting' }, { status: 400 });
    }

    const settings = await Settings.findOne({ type: 'theme' });
    const phoneCountry = normalizePhoneCountry(phoneCountryInput || settings?.defaultPhoneCountry);
    const formattedPhone = validateAndFormatPhone(phone, phoneCountry);
    if (!formattedPhone.valid) {
      return NextResponse.json({ success: false, message: 'Please enter a valid phone number' }, { status: 400 });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    let user = await User.findOne({ email });
    let accountCreated = false;

    if (!user) {
      user = await User.create({
        name: fullName,
        email,
        password: await bcrypt.hash(randomPassword(), 10),
        role: 'user',
        phone: formattedPhone.formatted,
        phoneCountry: formattedPhone.country,
        address,
        city,
        state,
        country,
      });
      accountCreated = true;
    } else {
      user.name = user.name || fullName;
      user.phone = formattedPhone.formatted;
      user.phoneCountry = formattedPhone.country;
      user.address = address;
      user.city = city;
      user.state = state;
      user.country = country;
    }

    const orderLoginToken = randomLoginToken();
    user.orderLoginTokenHash = await bcrypt.hash(orderLoginToken, 10);
    user.orderLoginTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const currency = (settings?.stripeCurrency || 'usd').toLowerCase();
    const amount = Number(service.price || 0);
    const stripeActive = Boolean(settings?.stripeEnabled && settings?.stripeSecretKey && amount > 0);

    const order = await Order.create({
      user: user._id,
      service: service._id,
      fullName,
      email,
      phone: formattedPhone.formatted,
      phoneCountry: formattedPhone.country,
      address,
      city,
      state,
      country,
      documents: [],
      amount,
      currency,
      paymentStatus: stripeActive ? 'pending' : 'not_required',
    });

    const folder = normalizeGcsPath(`users/${user._id}/orders/${order._id}`);
    await createFolder(folder);

    const documents = [];
    for (const file of files) {
      documents.push(await uploadFile(file, folder));
    }

    order.documents = documents;
    await order.save();

    await EmailVerification.deleteMany({
      email,
      $or: [{ purpose: 'email-verification' }, { purpose: { $exists: false } }],
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        userId: user._id,
        accountCreated,
        documents,
        loginEmail: user.email,
        orderLoginToken,
        paymentRequired: stripeActive,
      },
    }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, message: 'A duplicate record already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
