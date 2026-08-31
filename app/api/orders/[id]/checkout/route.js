import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from '@/lib/authOptions';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import '@/models/Service';
import { createStripeCheckoutSession } from '@/lib/stripe';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const order = await Order.findOne({ _id: id, user: session.user.id }).populate('service', 'title slug price');
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    const settings = await Settings.findOne({ type: 'theme' });
    const amount = Number(order.amount || 0);
    if (!settings?.stripeEnabled || !settings?.stripeSecretKey || amount <= 0) {
      order.paymentStatus = 'not_required';
      await order.save();
      return NextResponse.json({ success: true, checkoutUrl: `/thank-you?orderId=${order._id}` });
    }

    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const checkoutSession = await createStripeCheckoutSession({
      secretKey: settings.stripeSecretKey,
      origin,
      order,
      service: order.service,
      customerEmail: order.email,
      currency: order.currency || settings.stripeCurrency || 'usd',
    });

    order.paymentStatus = 'pending';
    order.stripeCheckoutSessionId = checkoutSession.id;
    order.stripePaymentIntentId = checkoutSession.payment_intent || '';
    await order.save();

    return NextResponse.json({ success: true, checkoutUrl: checkoutSession.url });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
